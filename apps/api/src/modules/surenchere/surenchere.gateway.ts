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
  SurenchereCreatePayload,
  SurenchereJoinPayload,
  SurenchereBidPayload,
  SurenchereVotePayload,
  SurenchereTypingPayload,
  SurenchereChooseChallengePayload,
  SurenchereSubmitWordsPayload,
  SurenchereUpdateSettingsPayload,
  SurenchereRoom,
  SurenchereRoundResult,
} from '@wiki-race/shared';
import { SurenchereService } from './surenchere.service';
import { WsExceptionFilter } from '../../filters/ws-exception.filter';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';
import { GAME_GATEWAY_CONFIG } from '../../common/game-room';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const NEXT_ROUND_DELAY_MS = 4000;
const BID_TIMEOUT_MS = 30_000;

@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway(GAME_GATEWAY_CONFIG)
export class SurenchereGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  private bidTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private wordsTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly surenchere: SurenchereService) {}

  handleDisconnect(client: TypedSocket): void {
    const room = this.surenchere.markDisconnected(client.id);
    if (!room) return;
    this.server.to(room.code).emit('surenchere:room:update', room);

    // If a voter disconnects during VOTING, check if remaining votes are complete
    if (room.phase === 'VOTING') {
      const { resolved, result, finished, scores } = this.surenchere.tryResolveVoting(room);
      if (resolved && result && scores !== undefined) {
        this.emitRoundEnd(room, result, finished ?? false, scores, client.id);
      }
    }
  }

  @SubscribeMessage('surenchere:create')
  async handleCreate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereCreatePayload,
  ): Promise<void> {
    const room = this.surenchere.createRoom(client.id, payload.pseudo, payload.settings ?? {});
    await client.join(room.code);
    this.server.to(room.code).emit('surenchere:room:update', room);
  }

  @SubscribeMessage('surenchere:join')
  async handleJoin(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereJoinPayload,
  ): Promise<void> {
    try {
      const room = this.surenchere.joinRoom(client.id, payload.roomCode, payload.pseudo);
      await client.join(payload.roomCode);
      this.server.to(payload.roomCode).emit('surenchere:room:update', room);
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      client.emit('surenchere:error', { code, message: code });
    }
  }

  @SubscribeMessage('surenchere:leave')
  async handleLeave(@ConnectedSocket() client: TypedSocket): Promise<void> {
    const room = this.surenchere.getRoomBySocket(client.id);
    if (room) this.clearRoomTimers(room.code);
    const { room: updatedRoom, deleted } = this.surenchere.leaveRoom(client.id);
    if (!deleted && updatedRoom) {
      await client.leave(updatedRoom.code);
      this.server.to(updatedRoom.code).emit('surenchere:room:update', updatedRoom);
    }
  }

  @SubscribeMessage('surenchere:update-settings')
  handleUpdateSettings(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereUpdateSettingsPayload,
  ): void {
    const room = this.surenchere.updateSettings(client.id, payload);
    this.server.to(room.code).emit('surenchere:room:update', room);
  }

  @SubscribeMessage('surenchere:start')
  handleStart(@ConnectedSocket() client: TypedSocket): void {
    const room = this.surenchere.startGame(client.id);
    this.server.to(room.code).emit('surenchere:room:update', room);
    this.server.to(room.code).emit('surenchere:round:start', {
      round: room.currentRound,
      firstBidderSocketId: room.challengeChooserSocketId ?? '',
    });
  }

  @SubscribeMessage('surenchere:choose_challenge')
  handleChooseChallenge(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereChooseChallengePayload,
  ): void {
    const room = this.surenchere.chooseChallenge(client.id, {
      challengeId: payload.challengeId,
      customPhrase: payload.customPhrase,
    });
    this.server.to(room.code).emit('surenchere:room:update', room);
    // Start the bid timer after challenge is chosen
    this.startBidTimer(room);
  }

  @SubscribeMessage('surenchere:bid')
  handleBid(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereBidPayload,
  ): void {
    const room = this.surenchere.placeBid(client.id, payload.amount);
    this.server.to(room.code).emit('surenchere:bid:update', {
      bidderSocketId: client.id,
      amount: payload.amount,
    });
    this.server.to(room.code).emit('surenchere:room:update', room);
    // Reset bid timer on each new bid
    this.startBidTimer(room);
  }

  @SubscribeMessage('surenchere:pass')
  handlePass(@ConnectedSocket() client: TypedSocket): void {
    const { room, allPassed } = this.surenchere.pass(client.id);
    this.server.to(room.code).emit('surenchere:pass:update', { socketId: client.id });
    this.server.to(room.code).emit('surenchere:room:update', room);
    if (allPassed) {
      this.clearBidTimer(room.code);
      this.startWordsTimer(room);
    } else {
      // Reset bid timer on each pass (still in bidding)
      if (room.phase === 'BIDDING') this.startBidTimer(room);
    }
  }

  @SubscribeMessage('surenchere:challenge')
  handleChallenge(@ConnectedSocket() client: TypedSocket): void {
    const room = this.surenchere.triggerChallenge(client.id);
    this.clearBidTimer(room.code);
    this.server.to(room.code).emit('surenchere:room:update', room);
    this.startWordsTimer(room);
  }

  @SubscribeMessage('surenchere:submit_words')
  handleSubmitWords(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereSubmitWordsPayload,
  ): void {
    this.clearWordsTimer(client.id);
    const room = this.surenchere.submitWords(client.id, payload.words);
    this.server.to(room.code).emit('surenchere:room:update', room);
  }

  @SubscribeMessage('surenchere:vote')
  handleVote(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereVotePayload,
  ): void {
    const { room, resolved, result, finished, scores } = this.surenchere.vote(
      client.id,
      payload.accept,
    );
    // Emit vote-update for real-time display (keyed by pseudo)
    const votes = this.buildVoteDisplay(room);
    this.server.to(room.code).emit('surenchere:vote-update', { votes });
    this.server.to(room.code).emit('surenchere:room:update', room);

    if (resolved && result && scores !== undefined) {
      this.emitRoundEnd(room, result, finished ?? false, scores, client.id);
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

  private buildVoteDisplay(room: SurenchereRoom): Record<string, boolean | null> {
    const result: Record<string, boolean | null> = {};
    for (const p of room.players) {
      if (p.socketId === room.currentBidderSocketId) continue;
      result[p.pseudo] = room.voteMap[p.socketId] ?? null;
    }
    return result;
  }

  private emitRoundEnd(
    room: SurenchereRoom,
    result: SurenchereRoundResult,
    finished: boolean,
    scores: Record<string, number>,
    hostId: string,
  ): void {
    this.server.to(room.code).emit('surenchere:round:end', { result, scores });
    this.server.to(room.code).emit('surenchere:room:update', room);

    if (finished) {
      this.server.to(room.code).emit('surenchere:game:finished', {
        scores,
        ranked: this.surenchere.rankPlayers(room),
      });
      return;
    }

    setTimeout(() => {
      try {
        const nextRoom = this.surenchere.nextRound(hostId);
        this.server.to(nextRoom.code).emit('surenchere:room:update', nextRoom);
        this.server.to(nextRoom.code).emit('surenchere:round:start', {
          round: nextRoom.currentRound,
          firstBidderSocketId: nextRoom.challengeChooserSocketId ?? '',
        });
        // Start bid timer for next round
        this.startBidTimer(nextRoom);
      } catch {
        // player left, ignore
      }
    }, NEXT_ROUND_DELAY_MS);
  }

  @SubscribeMessage('surenchere:reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    const room = this.surenchere.getRoomBySocket(client.id);
    if (room) this.clearRoomTimers(room.code);
    const updatedRoom = this.surenchere.resetRoom(client.id);
    this.server.to(updatedRoom.code).emit('surenchere:room:update', updatedRoom);
  }

  // ── Timer helpers ────────────────────────────────────────────────────────────

  private startBidTimer(room: SurenchereRoom): void {
    this.clearBidTimer(room.code);
    const endsAt = Date.now() + BID_TIMEOUT_MS;
    room.bidTimerEndsAt = endsAt;
    this.server.to(room.code).emit('surenchere:timer-update', { phase: 'BIDDING', endsAt });
    const timer = setTimeout(() => {
      this.onBidTimerExpired(room.code);
    }, BID_TIMEOUT_MS);
    this.bidTimers.set(room.code, timer);
  }

  private onBidTimerExpired(code: string): void {
    this.bidTimers.delete(code);
    const room = this.surenchere.getRoomByCode(code);
    if (!room || room.phase !== 'BIDDING') return;
    // Only auto-force if a bidder exists; if no one bid, leave the phase to resolve normally
    if (!room.currentBidderSocketId) return;
    const updatedRoom = this.surenchere.forceToWords(code);
    if (!updatedRoom) return;
    this.server.to(code).emit('surenchere:room:update', updatedRoom);
    this.startWordsTimer(updatedRoom);
  }

  private startWordsTimer(room: SurenchereRoom): void {
    this.clearWordsTimerByCode(room.code);
    const secs = room.settings.wordTimerSeconds;
    const endsAt = Date.now() + secs * 1000;
    room.wordsTimerEndsAt = endsAt;
    this.server.to(room.code).emit('surenchere:timer-update', { phase: 'WORDS', endsAt });
    const timer = setTimeout(() => {
      this.onWordsTimerExpired(room.code);
    }, secs * 1000);
    this.wordsTimers.set(room.code, timer);
  }

  private onWordsTimerExpired(code: string): void {
    this.wordsTimers.delete(code);
    const room = this.surenchere.getRoomByCode(code);
    if (!room || room.phase !== 'WORDS' || !room.currentBidderSocketId) return;
    try {
      // Auto-submit whatever words have been entered (empty = fail)
      const updatedRoom = this.surenchere.autoSubmitWords(room.currentBidderSocketId);
      this.server.to(code).emit('surenchere:room:update', updatedRoom);
      // Trigger vote resolution immediately (no eligible words → reject)
      const { resolved, result, finished, scores } = this.surenchere.tryResolveVoting(updatedRoom);
      if (resolved && result && scores !== undefined) {
        this.emitRoundEnd(updatedRoom, result, finished ?? false, scores, room.currentBidderSocketId);
      }
    } catch {
      // ignore
    }
  }

  private clearBidTimer(code: string): void {
    const t = this.bidTimers.get(code);
    if (t) {
      clearTimeout(t);
      this.bidTimers.delete(code);
    }
  }

  private clearWordsTimer(socketId: string): void {
    const room = this.surenchere.getRoomBySocket(socketId);
    if (room) this.clearWordsTimerByCode(room.code);
  }

  private clearWordsTimerByCode(code: string): void {
    const t = this.wordsTimers.get(code);
    if (t) {
      clearTimeout(t);
      this.wordsTimers.delete(code);
    }
  }

  private clearRoomTimers(code: string): void {
    this.clearBidTimer(code);
    this.clearWordsTimerByCode(code);
  }
}
