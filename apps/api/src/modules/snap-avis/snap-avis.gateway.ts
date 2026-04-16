import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SnapAvisCreatePayload,
  SnapAvisJoinPayload,
  SnapAvisStartPayload,
  SnapAvisSubmitWordPayload,
} from '@wiki-race/shared';
import { SnapAvisService } from './snap-avis.service';
import { WsExceptionFilter } from '../../filters/ws-exception.filter';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';
import { GAME_GATEWAY_CONFIG, extractErrorCode, RoomTimerService } from '../../common/game-room';
import { SnapAvisRoomInternal } from './snap-avis-room.types';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway(GAME_GATEWAY_CONFIG)
export class SnapAvisGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly snapAvis: SnapAvisService,
    private readonly timer: RoomTimerService,
  ) {}

  handleDisconnect(client: TypedSocket): void {
    const room = this.snapAvis.markDisconnected(client.id);
    if (!room) return;
    this.server.to(room.code).emit('snapavis:room-update', this.snapAvis.toDTO(room));
  }

  @SubscribeMessage('snapavis:create')
  async handleCreate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SnapAvisCreatePayload,
  ): Promise<void> {
    try {
      const room = this.snapAvis.createRoom(client.id, payload.pseudo);
      await client.join(room.code);
      client.emit('snapavis:room-update', this.snapAvis.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('snapavis:join')
  async handleJoin(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SnapAvisJoinPayload,
  ): Promise<void> {
    try {
      const room = this.snapAvis.joinRoom(client.id, payload.roomCode, payload.pseudo);
      await client.join(room.code);
      this.server.to(room.code).emit('snapavis:room-update', this.snapAvis.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('snapavis:leave')
  async handleLeave(@ConnectedSocket() client: TypedSocket): Promise<void> {
    const { room, deleted } = this.snapAvis.leaveRoom(client.id);
    if (!deleted && room) {
      await client.leave(room.code);
      this.timer.clearAll(room.code);
      this.server.to(room.code).emit('snapavis:room-update', this.snapAvis.toDTO(room));
    }
  }

  @SubscribeMessage('snapavis:start')
  handleStart(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SnapAvisStartPayload,
  ): void {
    try {
      const room = this.snapAvis.startGame(client.id, payload.settings);
      this.broadcastRoundStart(room);
      this.scheduleRevealTimer(room);
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('snapavis:submit-word')
  handleSubmitWord(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SnapAvisSubmitWordPayload,
  ): void {
    try {
      const { room, allSubmitted, pseudo } = this.snapAvis.submitWord(client.id, payload.word);
      this.server.to(room.code).emit('snapavis:word-received', { pseudo });

      if (allSubmitted) {
        this.timer.clear(room.code, 'writing');
        this.resolveRound(room.code);
      }
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('snapavis:reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    try {
      const existing = this.snapAvis.getRoomBySocket(client.id);
      if (existing) this.timer.clearAll(existing.code);
      const room = this.snapAvis.resetRoom(client.id);
      this.server.to(room.code).emit('snapavis:room-update', this.snapAvis.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('snapavis:next-round')
  handleNextRound(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.snapAvis.startNextRound(client.id);
      this.broadcastRoundStart(room);
      this.scheduleRevealTimer(room);
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private broadcastRoundStart(room: SnapAvisRoomInternal): void {
    this.server.to(room.code).emit('snapavis:round-start', {
      round: room.currentRound,
      total: room.settings.totalRounds,
      imageUrl: room.currentImage!.url,
    });
  }

  private scheduleRevealTimer(room: SnapAvisRoomInternal): void {
    this.timer.start(room.code, 'reveal', room.settings.revealDurationMs, () => {
      const endsAt = Date.now() + room.settings.writingDurationMs;
      const updatedRoom = this.snapAvis.setWritingPhase(room.code, endsAt);
      this.server.to(room.code).emit('snapavis:writing-start', { endsAt });
      // Keep room-update in sync (hasSubmitted resets, writingTimerEndsAt set)
      this.server.to(room.code).emit('snapavis:room-update', this.snapAvis.toDTO(updatedRoom));

      this.timer.start(room.code, 'writing', room.settings.writingDurationMs, () => {
        this.resolveRound(room.code);
      });
    });
  }

  private resolveRound(roomCode: string): void {
    try {
      const { room, result } = this.snapAvis.resolveRound(roomCode);
      this.server.to(roomCode).emit('snapavis:results', result);
      // Also update room so clients have current scores
      this.server.to(roomCode).emit('snapavis:room-update', this.snapAvis.toDTO(room));

      if (this.snapAvis.isGameOver(room)) {
        const rankings = this.snapAvis.buildRankings(room);
        // Délai de 5s : laisse les joueurs lire les résultats de la dernière manche
        // avant d'être redirigés vers le podium.
        const handle = setTimeout(() => {
          this.server.to(roomCode).emit('snapavis:game-finished', { rankings });
        }, 5000);
        handle.unref();
      }
    } catch {
      // Room may have been deleted (everyone left) — ignore
    }
  }

  private emitError(client: TypedSocket, e: unknown): void {
    const code = extractErrorCode(e);
    client.emit('snapavis:error', { code, message: code });
  }
}
