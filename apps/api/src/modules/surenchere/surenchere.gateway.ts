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
  SurenchereVerdictPayload,
  SurenchereChooseChallengePayload,
  SurenchereSubmitWordsPayload,
} from '@wiki-race/shared';
import { SurenchereService } from './surenchere.service';
import { WsExceptionFilter } from '../../filters/ws-exception.filter';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const NEXT_ROUND_DELAY_MS = 4000;

@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway({
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket'],
  cors: {
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    credentials: true,
  },
})
export class SurenchereGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  constructor(private readonly surenchere: SurenchereService) {}

  handleDisconnect(client: TypedSocket): void {
    const room = this.surenchere.markDisconnected(client.id);
    if (!room) return;
    this.server.to(room.code).emit('surenchere:room:update', room);
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
    const room = this.surenchere.joinRoom(client.id, payload.roomCode, payload.pseudo);
    await client.join(payload.roomCode);
    this.server.to(payload.roomCode).emit('surenchere:room:update', room);
  }

  @SubscribeMessage('surenchere:leave')
  async handleLeave(@ConnectedSocket() client: TypedSocket): Promise<void> {
    const { room, deleted } = this.surenchere.leaveRoom(client.id);
    if (!deleted && room) {
      await client.leave(room.code);
      this.server.to(room.code).emit('surenchere:room:update', room);
    }
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
    const room = this.surenchere.chooseChallenge(client.id, payload.challengeId);
    this.server.to(room.code).emit('surenchere:room:update', room);
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
  }

  @SubscribeMessage('surenchere:pass')
  handlePass(@ConnectedSocket() client: TypedSocket): void {
    const { room } = this.surenchere.pass(client.id);
    this.server.to(room.code).emit('surenchere:pass:update', { socketId: client.id });
    this.server.to(room.code).emit('surenchere:room:update', room);
  }

  @SubscribeMessage('surenchere:challenge')
  handleChallenge(@ConnectedSocket() client: TypedSocket): void {
    const room = this.surenchere.triggerChallenge(client.id);
    this.server.to(room.code).emit('surenchere:room:update', room);
  }

  @SubscribeMessage('surenchere:submit_words')
  handleSubmitWords(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereSubmitWordsPayload,
  ): void {
    const room = this.surenchere.submitWords(client.id, payload.words);
    this.server.to(room.code).emit('surenchere:room:update', room);
    if (room.currentChallenge && room.currentBidderSocketId) {
      this.server.to(room.code).emit('surenchere:verdict:start', {
        bidderSocketId: room.currentBidderSocketId,
        bid: room.currentBid,
        challenge: room.currentChallenge,
      });
    }
  }

  @SubscribeMessage('surenchere:verdict')
  handleVerdict(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: SurenchereVerdictPayload,
  ): void {
    const { room, result, finished } = this.surenchere.resolveVerdict(client.id, payload.success);
    const scores = this.surenchere.toScores(room);
    this.server.to(room.code).emit('surenchere:round:end', { result, scores });
    this.server.to(room.code).emit('surenchere:room:update', room);

    if (finished) {
      this.server.to(room.code).emit('surenchere:game:finished', {
        scores,
        ranked: this.surenchere.rankPlayers(room),
      });
      return;
    }

    const hostId = client.id;
    setTimeout(() => {
      try {
        const nextRoom = this.surenchere.nextRound(hostId);
        this.server.to(nextRoom.code).emit('surenchere:room:update', nextRoom);
        this.server.to(nextRoom.code).emit('surenchere:round:start', {
          round: nextRoom.currentRound,
          firstBidderSocketId: nextRoom.challengeChooserSocketId ?? '',
        });
      } catch {
        // host left, ignore
      }
    }, NEXT_ROUND_DELAY_MS);
  }

  @SubscribeMessage('surenchere:reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    const room = this.surenchere.resetRoom(client.id);
    this.server.to(room.code).emit('surenchere:room:update', room);
  }
}
