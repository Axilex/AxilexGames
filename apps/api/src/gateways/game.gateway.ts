import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { WsLoggingInterceptor } from '../interceptors/ws-logging.interceptor';
import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  RoomCreatePayload,
  RoomJoinPayload,
  GameStartPayload,
  GameConfirmChoicesPayload,
  GameNavigatePayload,
  GameSurrenderPayload,
  PlayerStatus,
  GameMode,
} from '@wiki-race/shared';
import { LobbyService } from '../modules/lobby/lobby.service';
import { GameService } from '../modules/game/game.service';
import { GameStateService } from '../modules/game/game-state.service';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const RECONNECT_TIMEOUT_MS = 30_000;

@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly lobby: LobbyService,
    private readonly game: GameService,
    private readonly gameState: GameStateService,
  ) {}

  handleConnection(_client: TypedSocket): void {
    // Nothing on bare connect — player must emit room:create or room:join
  }

  handleDisconnect(client: TypedSocket): void {
    const room = this.lobby.markDisconnected(client.id);
    if (!room) return;

    this.server.to(room.code).emit('player:disconnected', this.getPlayerPseudo(client.id, room));
    this.server.to(room.code).emit('room:update', this.lobby.toRoomDTO(room));

    // Purge player after timeout if they don't reconnect
    this.gameState.startReconnectTimer(client.id, RECONNECT_TIMEOUT_MS, () => {
      const { room: updatedRoom, deleted } = this.lobby.leaveRoom(room.code, client.id);
      if (!deleted && updatedRoom) {
        this.server.to(room.code).emit('room:update', this.lobby.toRoomDTO(updatedRoom));
      }
    });

    // If game in progress and all remaining players are inactive, end the game properly
    if (room.status === 'IN_PROGRESS') {
      const active = Array.from(room.players.values()).filter(
        (p) => p.status === PlayerStatus.CONNECTED,
      );
      if (active.length === 0 && room.game) {
        const summary = this.game.buildSummaryPublic(room);
        this.server.to(room.code).emit('game:finished', summary);
      }
    }
  }

  @SubscribeMessage('room:create')
  async handleRoomCreate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: RoomCreatePayload,
  ): Promise<void> {
    const { room, code } = this.lobby.createRoom(payload.pseudo, client.id);
    await client.join(code);
    this.server.to(code).emit('room:update', this.lobby.toRoomDTO(room));
  }

  @SubscribeMessage('room:join')
  async handleRoomJoin(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: RoomJoinPayload,
  ): Promise<void> {
    // Check if this is a reconnect
    const reconnected = this.lobby.handleReconnect(payload.roomCode, payload.pseudo, client.id);
    if (reconnected) {
      this.gameState.clearReconnectTimer(client.id);
      await client.join(payload.roomCode);
      this.server.to(payload.roomCode).emit('player:reconnected', payload.pseudo);
      this.server.to(payload.roomCode).emit('room:update', this.lobby.toRoomDTO(reconnected.room));
      if (reconnected.room.status === 'IN_PROGRESS') {
        this.server
          .to(payload.roomCode)
          .emit('game:state', this.game.toGameStateDTO(reconnected.room));
      }
      return;
    }

    const room = this.lobby.joinRoom(payload.roomCode, payload.pseudo, client.id);
    await client.join(payload.roomCode);
    this.server.to(payload.roomCode).emit('room:update', this.lobby.toRoomDTO(room));
  }

  @SubscribeMessage('room:reset')
  handleRoomReset(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { roomCode: string },
  ): void {
    const room = this.lobby.resetRoom(payload.roomCode, client.id);
    this.server.to(payload.roomCode).emit('room:update', this.lobby.toRoomDTO(room));
  }

  @SubscribeMessage('room:leave')
  async handleRoomLeave(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { roomCode: string },
  ): Promise<void> {
    const { room, deleted } = this.lobby.leaveRoom(payload.roomCode, client.id);
    await client.leave(payload.roomCode);
    if (!deleted && room) {
      this.server.to(payload.roomCode).emit('room:update', this.lobby.toRoomDTO(room));
    }
  }

  @SubscribeMessage('game:start')
  handleGameStart(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: GameStartPayload,
  ): void {
    const room = this.lobby.startChoosing(payload.roomCode, client.id);
    this.server.to(payload.roomCode).emit('room:update', this.lobby.toRoomDTO(room));
  }

  @SubscribeMessage('game:confirm_choices')
  async handleGameConfirmChoices(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: GameConfirmChoicesPayload,
  ): Promise<void> {
    const mode = payload.mode ?? GameMode.CLASSIC;

    // Validate Sprint: timer required
    if (mode === GameMode.SPRINT && !payload.timeLimitSeconds) {
      client.emit('error', 'SPRINT_REQUIRES_TIME_LIMIT');
      return;
    }

    // Validate Bingo: 4–6 constraints required
    if (mode === GameMode.BINGO) {
      const n = payload.bingoConstraintIds?.length ?? 0;
      if (n < 4 || n > 6) {
        client.emit('error', 'BINGO_INVALID_CONSTRAINTS');
        return;
      }
    }

    const { gameStateDTO, startPage } = await this.game.confirmChoices(
      payload.roomCode,
      client.id,
      mode,
      payload.timeLimitSeconds,
      (summary) => {
        this.server.to(payload.roomCode).emit('game:finished', summary);
      },
      payload.clickLimit,
      payload.startSlug,
      payload.targetSlug,
      payload.driftObjective,
      payload.bingoConstraintIds,
    );

    this.server.to(payload.roomCode).emit('game:state', gameStateDTO);
    this.server.to(payload.roomCode).emit('game:page', startPage);
  }

  @SubscribeMessage('game:navigate')
  async handleGameNavigate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: GameNavigatePayload,
  ): Promise<void> {
    const result = await this.game.navigate(payload.roomCode, client.id, payload.targetSlug);

    // Send new page only to the navigating player
    client.emit('game:page', result.page);

    // Broadcast progress update to the whole room
    this.server.to(payload.roomCode).emit('player:progress', result.progress);

    // Notify navigating player of newly validated Bingo constraints
    if (result.newlyValidated?.length) {
      client.emit('bingo:validated', {
        constraintIds: result.newlyValidated,
        slug: result.page.slug,
      });
    }

    if (result.finished && result.summary) {
      this.server.to(payload.roomCode).emit('game:finished', result.summary);
    }
  }

  @SubscribeMessage('game:surrender')
  handleGameSurrender(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: GameSurrenderPayload,
  ): void {
    const result = this.game.surrender(payload.roomCode, client.id);

    const room = this.lobby.findRoom(payload.roomCode);
    const player = room?.players.get(client.id);
    if (player && room?.game) {
      this.server
        .to(payload.roomCode)
        .emit('player:progress', this.game.toPlayerProgress(player, room.game));
    }

    if (result.allDone && result.summary) {
      this.server.to(payload.roomCode).emit('game:finished', result.summary);
    }
  }

  private getPlayerPseudo(
    socketId: string,
    room: { players: Map<string, { pseudo: string }> },
  ): string {
    return room.players.get(socketId)?.pseudo ?? '';
  }
}
