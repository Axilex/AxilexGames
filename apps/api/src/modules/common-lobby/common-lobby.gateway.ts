import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseInterceptors } from '@nestjs/common';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';
import { Server, Socket } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  LobbyCreatePayload,
  LobbyJoinPayload,
  LobbyChooseGamePayload,
} from '@wiki-race/shared';
import {
  GAME_GATEWAY_CONFIG,
  RECONNECT_TIMEOUT_MS,
  RoomTimerService,
  extractErrorCode,
} from '../../common/game-room';
import { CommonLobbyService } from './common-lobby.service';
import { CommonLobbyRegistryService } from './common-lobby-registry.service';
import { SurenchereService } from '../surenchere/surenchere.service';
import { LobbyService } from '../lobby/lobby.service';
import { SnapAvisService } from '../snap-avis/snap-avis.service';
import { TelepathieService } from '../telepathie/telepathie.service';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// No global WsExceptionFilter here: every handler is wrapped in try/catch and
// emits the namespaced `lobby:error` event. Adding the filter would let the
// generic `error` event leak across game gateways (cross-game error routing).
@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway(GAME_GATEWAY_CONFIG)
export class CommonLobbyGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  private readonly logger = new Logger(CommonLobbyGateway.name);

  constructor(
    private readonly lobbyService: CommonLobbyService,
    private readonly registry: CommonLobbyRegistryService,
    private readonly surenchereService: SurenchereService,
    private readonly wikiLobbyService: LobbyService,
    private readonly snapAvisService: SnapAvisService,
    private readonly telepathieService: TelepathieService,
    private readonly timer: RoomTimerService,
  ) {}

  handleDisconnect(client: TypedSocket): void {
    try {
      const room = this.lobbyService.markDisconnected(client.id);
      if (!room) return;
      this.server.to(room.code).emit('lobby:room-update', this.registry.toDTO(room));

      // Ghost purge: if the player does not reconnect within 30s, remove them so the
      // room (and host slot) does not stay locked by a disconnected player.
      this.timer.start(client.id, 'reconnect', RECONNECT_TIMEOUT_MS, () => {
        if (!this.lobbyService.getRoom(client.id)) return;
        const { room: updated, deleted } = this.lobbyService.leaveRoom(client.id);
        if (!deleted && updated) {
          this.server.to(updated.code).emit('lobby:room-update', this.registry.toDTO(updated));
        }
      });
    } catch (e) {
      this.logger.debug(`handleDisconnect swallowed: ${extractErrorCode(e)}`);
    }
  }

  @SubscribeMessage('lobby:create')
  async handleCreate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: LobbyCreatePayload,
  ): Promise<void> {
    try {
      const { room, sessionToken } = this.lobbyService.createRoom(payload.pseudo, client.id);
      await client.join(room.code);
      client.emit('lobby:room-update', this.registry.toDTO(room));
      client.emit('lobby:session', { token: sessionToken });
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('lobby:join')
  async handleJoin(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: LobbyJoinPayload,
  ): Promise<void> {
    try {
      const previousSocketId = this.lobbyService.findReconnectSocketId(
        payload.roomCode,
        payload.pseudo,
      );
      const { room, sessionToken } = this.lobbyService.joinRoom(
        payload.roomCode,
        payload.pseudo,
        client.id,
        payload.sessionToken,
      );
      if (previousSocketId) this.timer.clear(previousSocketId, 'reconnect');
      await client.join(room.code);
      this.server.to(room.code).emit('lobby:room-update', this.registry.toDTO(room));
      client.emit('lobby:session', { token: sessionToken });
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('lobby:leave')
  async handleLeave(@ConnectedSocket() client: TypedSocket): Promise<void> {
    try {
      const { room, deleted } = this.lobbyService.leaveRoom(client.id);
      if (!deleted && room) {
        await client.leave(room.code);
        this.server.to(room.code).emit('lobby:room-update', this.registry.toDTO(room));
      }
    } catch (e) {
      this.logger.debug(`handleLeave swallowed: ${extractErrorCode(e)}`);
    }
  }

  @SubscribeMessage('lobby:choose-game')
  handleChooseGame(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: LobbyChooseGamePayload,
  ): void {
    try {
      const room = this.lobbyService.chooseGame(client.id, payload.game);
      this.server.to(room.code).emit('lobby:room-update', this.registry.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('lobby:clear-game')
  handleClearGame(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.lobbyService.clearGameChoice(client.id);
      this.server.to(room.code).emit('lobby:room-update', this.registry.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('lobby:start')
  handleStart(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.lobbyService.startRoom(client.id);
      const players = this.lobbyService.getConnectedPlayers(room);
      const seedPlayers = players.map((p) => ({
        pseudo: p.pseudo,
        isHost: p.socketId === room.hostSocketId,
      }));

      if (room.gameChoice === 'surenchere') {
        this.surenchereService.seedRoom(room.code, seedPlayers);
      } else if (room.gameChoice === 'wikirace') {
        this.wikiLobbyService.seedRoom(room.code, seedPlayers);
      } else if (room.gameChoice === 'snap-avis') {
        this.snapAvisService.seedRoom(room.code, seedPlayers);
      } else if (room.gameChoice === 'telepathie') {
        this.telepathieService.seedRoom(room.code, seedPlayers);
      }

      // Push the IN_GAME state to clients before redirecting so their common-lobby store
      // reflects reality. Without this, returning players keep a stale WAITING snapshot
      // and the onMounted guard skips the rejoin that would show "Choisir un nouveau jeu".
      this.server.to(room.code).emit('lobby:room-update', this.registry.toDTO(room));
      this.server.to(room.code).emit('lobby:redirect', { game: room.gameChoice, code: room.code });
      // Room stays alive in IN_GAME state so players can return to it after the game
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('lobby:reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.lobbyService.resetToWaiting(client.id);
      this.server.to(room.code).emit('lobby:room-update', this.registry.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  private emitError(client: TypedSocket, e: unknown): void {
    const message = extractErrorCode(e);
    client.emit('lobby:error', { code: message, message });
  }
}
