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
  ClientToServerEvents,
  ServerToClientEvents,
  SurenchereCreatePayload,
  SurenchereJoinPayload,
  SurenchereBidPayload,
  SurenchereVotePayload,
  SurenchereTypingPayload,
  SurenchereChooseChallengePayload,
  SurenchereSubmitWordsPayload,
  SurenchereUpdateSettingsPayload,
  SurenchereRoundResult,
} from '@wiki-race/shared';
import { SurenchereService } from './surenchere.service';
import { SurenchereRoomInternal } from './surenchere-room.types';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';
import {
  GAME_GATEWAY_CONFIG,
  extractErrorCode,
  RoomTimerService,
  RECONNECT_TIMEOUT_MS,
} from '../../common/game-room';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const NEXT_ROUND_DELAY_MS = 4000;
const CHOOSE_TIMEOUT_MS = 10_000;
const BID_TIMEOUT_MS = 30_000;

@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway(GAME_GATEWAY_CONFIG)
export class SurenchereGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  private readonly logger = new Logger(SurenchereGateway.name);

  constructor(
    private readonly surenchere: SurenchereService,
    private readonly timer: RoomTimerService,
  ) {}

  handleDisconnect(client: TypedSocket): void {
    const room = this.surenchere.markDisconnected(client.id);
    if (!room) return;
    this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));

    // If a voter disconnects during VOTING, check if remaining votes are complete
    if (room.phase === 'VOTING') {
      const { resolved, result, finished, scores } = this.surenchere.tryResolveVoting(room);
      if (resolved && result && scores !== undefined) {
        this.emitRoundEnd(room, result, finished ?? false, scores, client.id);
      }
    }

    // Ghost purge: if the player does not reconnect within 30s, remove them from the room
    this.timer.start(client.id, 'reconnect', RECONNECT_TIMEOUT_MS, () => {
      // getRoomBySocket returns null if the socket was rebound (player reconnected)
      if (!this.surenchere.getRoomBySocket(client.id)) return;
      const { room: updatedRoom, deleted } = this.surenchere.leaveRoom(client.id);
      if (deleted || !updatedRoom) return;
      this.server
        .to(updatedRoom.code)
        .emit('surenchere:room:update', this.surenchere.toDTO(updatedRoom));
      if (updatedRoom.phase === 'VOTING') {
        const { resolved, result, finished, scores } =
          this.surenchere.tryResolveVoting(updatedRoom);
        if (resolved && result && scores !== undefined) {
          this.emitRoundEnd(updatedRoom, result, finished ?? false, scores, client.id);
        }
      }
    });
  }

  @SubscribeMessage('surenchere:create')
  async handleCreate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereCreatePayload,
  ): Promise<void> {
    try {
      const { room, sessionToken } = this.surenchere.createRoom(
        client.id,
        payload.pseudo,
        payload.settings ?? {},
      );
      await client.join(room.code);
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
      client.emit('surenchere:session', { token: sessionToken });
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:join')
  async handleJoin(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereJoinPayload,
  ): Promise<void> {
    try {
      const previousSocketId = this.surenchere.findReconnectSocketId(
        payload.roomCode,
        payload.pseudo,
      );
      const { room, sessionToken } = this.surenchere.joinRoom(
        client.id,
        payload.roomCode,
        payload.pseudo,
        payload.sessionToken,
      );
      if (previousSocketId) this.timer.clear(previousSocketId, 'reconnect');
      await client.join(payload.roomCode);
      this.server.to(payload.roomCode).emit('surenchere:room:update', this.surenchere.toDTO(room));
      client.emit('surenchere:session', { token: sessionToken });
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:leave')
  async handleLeave(@ConnectedSocket() client: TypedSocket): Promise<void> {
    const room = this.surenchere.getRoomBySocket(client.id);
    if (room) this.timer.clearAll(room.code);
    const { room: updatedRoom, deleted } = this.surenchere.leaveRoom(client.id);
    if (!deleted && updatedRoom) {
      await client.leave(updatedRoom.code);
      this.server
        .to(updatedRoom.code)
        .emit('surenchere:room:update', this.surenchere.toDTO(updatedRoom));
    }
  }

  @SubscribeMessage('surenchere:update-settings')
  handleUpdateSettings(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereUpdateSettingsPayload,
  ): void {
    try {
      const room = this.surenchere.updateSettings(client.id, payload);
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:start')
  handleStart(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.surenchere.startGame(client.id);
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
      this.server.to(room.code).emit('surenchere:round:start', {
        round: room.currentRound,
        firstBidderSocketId: room.challengeChooserSocketId ?? '',
      });
      this.startChooseTimer(room);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:choose_challenge')
  handleChooseChallenge(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereChooseChallengePayload,
  ): void {
    try {
      const room = this.surenchere.chooseChallenge(client.id, {
        challengeId: payload.challengeId,
        customPhrase: payload.customPhrase,
      });
      this.timer.clear(room.code, 'choose');
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
      this.startBidTimer(room);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:bid')
  handleBid(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereBidPayload,
  ): void {
    try {
      const room = this.surenchere.placeBid(client.id, payload.amount);
      this.server.to(room.code).emit('surenchere:bid:update', {
        bidderSocketId: client.id,
        amount: payload.amount,
      });
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
      this.startBidTimer(room);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:pass')
  handlePass(@ConnectedSocket() client: TypedSocket): void {
    try {
      const { room, allPassed } = this.surenchere.pass(client.id);
      this.server.to(room.code).emit('surenchere:pass:update', { socketId: client.id });
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
      if (allPassed) {
        this.timer.clear(room.code, 'bid');
        this.startWordsTimer(room);
      } else {
        if (room.phase === 'BIDDING') this.startBidTimer(room);
      }
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:challenge')
  handleChallenge(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.surenchere.triggerChallenge(client.id);
      this.timer.clear(room.code, 'bid');
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
      this.startWordsTimer(room);
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:submit_words')
  handleSubmitWords(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereSubmitWordsPayload,
  ): void {
    try {
      this.clearWordsTimer(client.id);
      const room = this.surenchere.submitWords(client.id, payload.words);
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:vote')
  handleVote(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereVotePayload,
  ): void {
    try {
      const { room, resolved, result, finished, scores } = this.surenchere.vote(
        client.id,
        payload.accept,
      );
      const votes = this.buildVoteDisplay(room);
      this.server.to(room.code).emit('surenchere:vote-update', { votes });
      this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));
      if (resolved && result && scores !== undefined) {
        this.emitRoundEnd(room, result, finished ?? false, scores, client.id);
      }
    } catch (err) {
      this.emitError(client, err);
    }
  }

  @SubscribeMessage('surenchere:typing')
  handleTyping(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereTypingPayload,
  ): void {
    const room = this.surenchere.getRoomBySocket(client.id);
    if (!room || room.phase !== 'WORDS') return;
    if (room.currentBidderSocketId !== client.id) return;
    const player = room.players.find((p) => p.socketId === client.id);
    if (!player) return;
    // Pure relay — no storage
    client.broadcast.to(room.code).emit('surenchere:typing-update', {
      pseudo: player.pseudo,
      text: payload.text,
    });
  }

  private buildVoteDisplay(room: SurenchereRoomInternal): Record<string, boolean | null> {
    const result: Record<string, boolean | null> = {};
    for (const p of room.players) {
      if (p.socketId === room.currentBidderSocketId) continue;
      result[p.pseudo] = room.voteMap[p.socketId] ?? null;
    }
    return result;
  }

  private emitRoundEnd(
    room: SurenchereRoomInternal,
    result: SurenchereRoundResult,
    finished: boolean,
    scores: Record<string, number>,
    hostId: string,
  ): void {
    this.server.to(room.code).emit('surenchere:round:end', { result, scores });
    this.server.to(room.code).emit('surenchere:room:update', this.surenchere.toDTO(room));

    if (finished) {
      this.server.to(room.code).emit('surenchere:game:finished', {
        scores,
        ranked: this.surenchere.rankPlayers(room),
      });
      return;
    }

    this.timer.start(room.code, 'nextRound', NEXT_ROUND_DELAY_MS, () => {
      try {
        const nextRoom = this.surenchere.nextRound(hostId);
        this.server
          .to(nextRoom.code)
          .emit('surenchere:room:update', this.surenchere.toDTO(nextRoom));
        this.server.to(nextRoom.code).emit('surenchere:round:start', {
          round: nextRoom.currentRound,
          firstBidderSocketId: nextRoom.challengeChooserSocketId ?? '',
        });
        this.startChooseTimer(nextRoom);
      } catch (e) {
        this.logger.debug(`nextRound timer swallowed: ${extractErrorCode(e)}`);
      }
    });
  }

  @SubscribeMessage('surenchere:reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    try {
      const room = this.surenchere.getRoomBySocket(client.id);
      if (room) this.timer.clearAll(room.code);
      const updatedRoom = this.surenchere.resetRoom(client.id);
      this.server
        .to(updatedRoom.code)
        .emit('surenchere:room:update', this.surenchere.toDTO(updatedRoom));
    } catch (err) {
      this.emitError(client, err);
    }
  }

  // ── Timer helpers ────────────────────────────────────────────────────────────

  private startBidTimer(room: SurenchereRoomInternal): void {
    const endsAt = Date.now() + BID_TIMEOUT_MS;
    room.bidTimerEndsAt = endsAt;
    this.server.to(room.code).emit('surenchere:timer-update', { phase: 'BIDDING', endsAt });
    this.timer.start(room.code, 'bid', BID_TIMEOUT_MS, () => this.onBidTimerExpired(room.code));
  }

  private onBidTimerExpired(code: string): void {
    const room = this.surenchere.getRoomByCode(code);
    if (!room || room.phase !== 'BIDDING' || !room.currentBidderSocketId) return;
    const updatedRoom = this.surenchere.forceToWords(code);
    if (!updatedRoom) return;
    this.server.to(code).emit('surenchere:room:update', this.surenchere.toDTO(updatedRoom));
    this.startWordsTimer(updatedRoom);
  }

  private startWordsTimer(room: SurenchereRoomInternal): void {
    const secs = room.settings.wordTimerSeconds;
    const endsAt = Date.now() + secs * 1000;
    room.wordsTimerEndsAt = endsAt;
    this.server.to(room.code).emit('surenchere:timer-update', { phase: 'WORDS', endsAt });
    this.timer.start(room.code, 'words', secs * 1000, () => this.onWordsTimerExpired(room.code));
  }

  private onWordsTimerExpired(code: string): void {
    const room = this.surenchere.getRoomByCode(code);
    if (!room || room.phase !== 'WORDS' || !room.currentBidderSocketId) return;
    try {
      const updatedRoom = this.surenchere.autoSubmitWords(room.currentBidderSocketId);
      this.server.to(code).emit('surenchere:room:update', this.surenchere.toDTO(updatedRoom));
      const { resolved, result, finished, scores } = this.surenchere.tryResolveVoting(updatedRoom);
      if (resolved && result && scores !== undefined) {
        this.emitRoundEnd(
          updatedRoom,
          result,
          finished ?? false,
          scores,
          room.currentBidderSocketId,
        );
      }
    } catch (e) {
      this.logger.debug(`onWordsTimerExpired swallowed: ${extractErrorCode(e)}`);
    }
  }

  private startChooseTimer(room: SurenchereRoomInternal): void {
    const endsAt = Date.now() + CHOOSE_TIMEOUT_MS;
    room.chooseTimerEndsAt = endsAt;
    this.server.to(room.code).emit('surenchere:timer-update', { phase: 'CHOOSING', endsAt });
    this.timer.start(room.code, 'choose', CHOOSE_TIMEOUT_MS, () =>
      this.onChooseTimerExpired(room.code),
    );
  }

  private onChooseTimerExpired(code: string): void {
    const room = this.surenchere.getRoomByCode(code);
    if (!room || room.phase !== 'CHOOSING_CHALLENGE') return;
    try {
      const updatedRoom = this.surenchere.autoChooseChallenge(code);
      this.server.to(code).emit('surenchere:room:update', this.surenchere.toDTO(updatedRoom));
      this.startBidTimer(updatedRoom);
    } catch (e) {
      this.logger.debug(`onChooseTimerExpired swallowed: ${extractErrorCode(e)}`);
    }
  }

  private clearWordsTimer(socketId: string): void {
    const room = this.surenchere.getRoomBySocket(socketId);
    if (room) this.timer.clear(room.code, 'words');
  }

  private emitError(client: TypedSocket, e: unknown): void {
    const code = extractErrorCode(e);
    client.emit('surenchere:error', { code, message: code });
  }
}
