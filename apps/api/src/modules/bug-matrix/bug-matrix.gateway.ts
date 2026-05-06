import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseInterceptors } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  BugMatrixCreatePayload,
  BugMatrixJoinPayload,
  BugMatrixStartPayload,
  BugMatrixVoteSubmitPayload,
  ClientToServerEvents,
  PlayerStatus,
  ServerToClientEvents,
} from '@wiki-race/shared';
import { BugMatrixService } from './bug-matrix.service';
import { BugMatrixRoomInternal } from './bug-matrix-room.types';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';
import {
  GAME_GATEWAY_CONFIG,
  RECONNECT_TIMEOUT_MS,
  RoomTimerService,
  extractErrorCode,
} from '../../common/game-room';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const BRIEF_DURATION_MS = 8_000;
const REVEAL_TO_NEXT_MS = 8_000;

@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway(GAME_GATEWAY_CONFIG)
export class BugMatrixGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  private readonly logger = new Logger(BugMatrixGateway.name);

  constructor(
    private readonly bugMatrix: BugMatrixService,
    private readonly timer: RoomTimerService,
  ) {}

  handleDisconnect(client: TypedSocket): void {
    const room = this.bugMatrix.markDisconnected(client.id);
    if (!room) return;
    this.broadcastRoom(room);

    // If we were waiting on this player's vote and removing them now means
    // everyone else has voted, resolve immediately.
    if (room.phase === 'VOTE') this.maybeResolveVote(room);

    this.timer.start(client.id, 'reconnect', RECONNECT_TIMEOUT_MS, () => {
      if (this.bugMatrix.getRoomBySocket(client.id)) return;
      const { room: updated, deleted } = this.bugMatrix.leaveRoom(client.id);
      if (deleted || !updated) return;
      this.broadcastRoom(updated);
      if (updated.phase === 'VOTE') this.maybeResolveVote(updated);
    });
  }

  // ── Room lifecycle ─────────────────────────────────────────────────────────

  @SubscribeMessage('bugmatrix:room-create')
  async handleCreate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: BugMatrixCreatePayload,
  ): Promise<void> {
    try {
      const { room, sessionToken } = this.bugMatrix.createRoom(
        client.id,
        payload.pseudo,
        payload.settings ?? {},
      );
      await client.join(room.code);
      this.broadcastRoom(room);
      client.emit('bugmatrix:session', { token: sessionToken });
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('bugmatrix:room-join')
  async handleJoin(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: BugMatrixJoinPayload,
  ): Promise<void> {
    try {
      const previousSocketId = this.bugMatrix.findReconnectSocketId(
        payload.roomCode,
        payload.pseudo,
      );
      const { room, sessionToken, reconnected } = this.bugMatrix.joinRoom(
        client.id,
        payload.roomCode,
        payload.pseudo,
        payload.sessionToken,
      );
      if (previousSocketId) this.timer.clear(previousSocketId, 'reconnect');
      await client.join(payload.roomCode);
      this.broadcastRoom(room);
      client.emit('bugmatrix:session', { token: sessionToken });

      // If reconnecting mid-game, resend the player their secret role + active
      // theme + current question so the UI rehydrates correctly.
      if (reconnected && room.phase !== 'WAITING') {
        const p = room.players.find((pp) => pp.socketId === client.id);
        if (p?.role) {
          client.emit('bugmatrix:secret-role', {
            role: p.role,
            ruleLabel: p.ruleLabel,
            ruleCategory: p.ruleCategory,
          });
        }
        if (room.themeLabel) client.emit('bugmatrix:theme', { themeLabel: room.themeLabel });
        if (room.phase === 'DISCUSSION' && room.currentQuestion) {
          client.emit('bugmatrix:question', room.currentQuestion);
        }
      }
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('bugmatrix:room-leave')
  async handleLeave(@ConnectedSocket() client: TypedSocket): Promise<void> {
    const room = this.bugMatrix.getRoomBySocket(client.id);
    if (room) this.timer.clearAll(room.code);
    const { room: updated, deleted } = this.bugMatrix.leaveRoom(client.id);
    if (!deleted && updated) {
      await client.leave(updated.code);
      this.broadcastRoom(updated);
    }
  }

  @SubscribeMessage('bugmatrix:room-reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.bugMatrix.getRoomBySocket(client.id);
      if (room) this.timer.clearAll(room.code);
      const updated = this.bugMatrix.resetRoom(client.id);
      this.broadcastRoom(updated);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  // ── Game flow ──────────────────────────────────────────────────────────────

  @SubscribeMessage('bugmatrix:game-start')
  handleStart(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: BugMatrixStartPayload,
  ): void {
    try {
      const room = this.bugMatrix.startGame(client.id, payload?.settings);
      this.beginBriefPhase(room);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('bugmatrix:vote-submit')
  handleVote(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: BugMatrixVoteSubmitPayload,
  ): void {
    try {
      const { room, allVoted } = this.bugMatrix.submitVote(client.id, payload.votes);
      this.broadcastRoom(room);
      if (allVoted) {
        this.timer.clear(room.code, 'vote');
        this.emitReveal(room.code);
      }
    } catch (err) {
      this.emitError(client, err);
    }
  }

  // ── Phase orchestration helpers ────────────────────────────────────────────

  private beginBriefPhase(room: BugMatrixRoomInternal): void {
    this.broadcastRoom(room);
    if (room.themeLabel) {
      this.server.to(room.code).emit('bugmatrix:theme', { themeLabel: room.themeLabel });
    }
    // Unicast each player's secret role
    for (const p of room.players) {
      if (p.status !== PlayerStatus.CONNECTED || !p.role) continue;
      this.server.to(p.socketId).emit('bugmatrix:secret-role', {
        role: p.role,
        ruleLabel: p.ruleLabel,
        ruleCategory: p.ruleCategory,
      });
    }
    this.server.to(room.code).emit('bugmatrix:phase-start', {
      phase: 'BRIEF',
      timerMs: BRIEF_DURATION_MS,
    });
    this.timer.start(room.code, 'brief', BRIEF_DURATION_MS, () =>
      this.transitionToDiscussion(room.code),
    );
  }

  private transitionToDiscussion(code: string): void {
    try {
      const room = this.bugMatrix.enterDiscussion(code, Date.now());
      this.broadcastRoom(room);
      this.server.to(room.code).emit('bugmatrix:phase-start', {
        phase: 'DISCUSSION',
        timerMs: room.settings.discussionMs,
      });
      // Push the first question immediately, then schedule rotation + global end timer.
      this.rotateAndEmitQuestion(code);
      this.timer.start(code, 'questionRotation', this.questionRotationMs(code), () =>
        this.onQuestionRotationTick(code),
      );
      this.timer.start(code, 'discussion', room.settings.discussionMs, () =>
        this.transitionToVote(code),
      );
    } catch (e) {
      this.logger.debug(`transitionToDiscussion swallowed: ${extractErrorCode(e)}`);
    }
  }

  private rotateAndEmitQuestion(code: string): void {
    const q = this.bugMatrix.rotateQuestion(code);
    if (q) this.server.to(code).emit('bugmatrix:question', q);
  }

  private onQuestionRotationTick(code: string): void {
    const room = this.bugMatrix.getRoomByCode(code);
    if (!room || room.phase !== 'DISCUSSION') return;
    this.rotateAndEmitQuestion(code);
    this.timer.start(code, 'questionRotation', this.questionRotationMs(code), () =>
      this.onQuestionRotationTick(code),
    );
  }

  private questionRotationMs(code: string): number {
    const room = this.bugMatrix.getRoomByCode(code);
    return room?.settings.questionRotationMs ?? 30_000;
  }

  private transitionToVote(code: string): void {
    try {
      this.timer.clear(code, 'questionRotation');
      const room = this.bugMatrix.enterVote(code, Date.now());
      this.broadcastRoom(room);
      this.server.to(code).emit('bugmatrix:phase-start', {
        phase: 'VOTE',
        timerMs: room.settings.voteMs,
      });
      this.timer.start(code, 'vote', room.settings.voteMs, () => this.emitReveal(code));
    } catch (e) {
      this.logger.debug(`transitionToVote swallowed: ${extractErrorCode(e)}`);
    }
  }

  private maybeResolveVote(room: BugMatrixRoomInternal): void {
    const eligible = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    const allVoted = eligible.length > 0 && eligible.every((p) => room.voteMap[p.pseudo]);
    if (allVoted) {
      this.timer.clear(room.code, 'vote');
      this.emitReveal(room.code);
    }
  }

  private emitReveal(code: string): void {
    try {
      const room = this.bugMatrix.getRoomByCode(code);
      if (!room || room.phase !== 'VOTE') return;
      const { result, finished } = this.bugMatrix.resolveRound(code);
      this.broadcastRoom(room);
      this.server.to(code).emit('bugmatrix:round-result', result);
      if (finished) {
        this.server.to(code).emit('bugmatrix:game-finished', {
          rankings: this.bugMatrix.rankPlayers(room),
        });
        return;
      }
      this.timer.start(code, 'nextRound', REVEAL_TO_NEXT_MS, () => {
        try {
          const next = this.bugMatrix.nextRound(code);
          this.beginBriefPhase(next);
        } catch (e) {
          this.logger.debug(`nextRound timer swallowed: ${extractErrorCode(e)}`);
        }
      });
    } catch (e) {
      this.logger.debug(`emitReveal swallowed: ${extractErrorCode(e)}`);
    }
  }

  // ── Plumbing ───────────────────────────────────────────────────────────────

  private broadcastRoom(room: BugMatrixRoomInternal): void {
    this.server.to(room.code).emit('bugmatrix:room-update', this.bugMatrix.toDTO(room));
  }

  private emitError(client: TypedSocket, e: unknown): void {
    const code = extractErrorCode(e);
    client.emit('bugmatrix:error', { code, message: code });
  }
}
