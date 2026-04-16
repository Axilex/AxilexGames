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
  TelepathieCreatePayload,
  TelepathieJoinPayload,
  TelepathieStartPayload,
  TelepathieSubmitPayload,
  TelepathieChooseWordPayload,
} from '@wiki-race/shared';
import { TelepathieService } from './telepathie.service';
import { TelepathieTimerService } from './telepathie-timer.service';
import { WsExceptionFilter } from '../../filters/ws-exception.filter';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';
import { GAME_GATEWAY_CONFIG, extractErrorCode } from '../../common/game-room';
import { TelepathieRoomInternal } from './telepathie-room.types';

/** Délai d'affichage du résultat avant de lancer le sous-round suivant (ms) */
const AUTO_NEXT_DELAY_MS = 3000;
/** Durée du timer de choix de mot en début de manche (s) */
const CHOOSE_TIMER_SECONDS = 30;

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

@UseFilters(WsExceptionFilter)
@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway(GAME_GATEWAY_CONFIG)
export class TelepathieGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  constructor(
    private readonly telepathie: TelepathieService,
    private readonly timerService: TelepathieTimerService,
  ) {}

  handleDisconnect(client: TypedSocket): void {
    const room = this.telepathie.markDisconnected(client.id);
    if (!room) return;
    this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));
  }

  @SubscribeMessage('telepathie:create')
  async handleCreate(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: TelepathieCreatePayload,
  ): Promise<void> {
    try {
      const room = this.telepathie.createRoom(client.id, payload.pseudo);
      await client.join(room.code);
      client.emit('telepathie:room-update', this.telepathie.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('telepathie:join')
  async handleJoin(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: TelepathieJoinPayload,
  ): Promise<void> {
    try {
      const room = this.telepathie.joinRoom(client.id, payload.roomCode, payload.pseudo);
      await client.join(room.code);
      this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('telepathie:leave')
  async handleLeave(@ConnectedSocket() client: TypedSocket): Promise<void> {
    try {
      const { room, deleted } = this.telepathie.leaveRoom(client.id);
      if (!deleted && room) {
        await client.leave(room.code);
        this.timerService.clearAllTimers(room.code);
        this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));
      }
    } catch {
      // ignore
    }
  }

  @SubscribeMessage('telepathie:start')
  handleStart(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: TelepathieStartPayload,
  ): void {
    try {
      const room = this.telepathie.startGame(client.id, payload.settings);
      this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));
      this.openChoosing(room);
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('telepathie:choose-word')
  handleChooseWord(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: TelepathieChooseWordPayload,
  ): void {
    try {
      const { room, allChosen } = this.telepathie.chooseWord(client.id, payload.word);
      this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));
      if (allChosen) {
        this.timerService.clearChooseTimer(room.code);
        this.startManche(room.code);
      }
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('telepathie:submit')
  handleSubmit(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: TelepathieSubmitPayload,
  ): void {
    try {
      const { room, allSubmitted, pseudo } = this.telepathie.submitWord(client.id, payload.word);
      this.server.to(room.code).emit('telepathie:word-received', { pseudo });

      if (allSubmitted) {
        this.timerService.clearRoundTimer(room.code);
        this.resolveRound(room.code);
      }
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('telepathie:next-manche')
  handleNextManche(@ConnectedSocket() client: TypedSocket): void {
    try {
      // Annule le timer auto-next si l'hôte clique avant (ne devrait pas arriver mais sécurité)
      const existing = this.telepathie.getRoomBySocket(client.id);
      if (existing) this.timerService.clearAutoNextTimer(existing.code);

      const room = this.telepathie.nextManche(client.id);
      this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));

      if (room.phase === 'CHOOSING') {
        this.openChoosing(room);
      } else if (room.phase === 'FINISHED') {
        const rankings = this.telepathie.buildRankings(room);
        const handle = setTimeout(() => {
          this.server.to(room.code).emit('telepathie:game-finished', { rankings });
        }, 3000);
        handle.unref();
      }
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('telepathie:reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    try {
      const existing = this.telepathie.getRoomBySocket(client.id);
      if (existing) this.timerService.clearAllTimers(existing.code);
      const room = this.telepathie.resetRoom(client.id);
      this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /** Ouvre la phase CHOOSING : arme le timer et émet `choose-open`. */
  private openChoosing(room: TelepathieRoomInternal): void {
    const endsAt = Date.now() + CHOOSE_TIMER_SECONDS * 1000;
    room.roundTimerEndsAt = endsAt;
    this.server.to(room.code).emit('telepathie:choose-open', { endsAt });
    this.timerService.startChooseTimer(room.code, CHOOSE_TIMER_SECONDS, () => {
      this.startManche(room.code);
    });
  }

  /** Démarre la manche après la phase CHOOSING. */
  private startManche(roomCode: string): void {
    try {
      const room = this.telepathie.openManche(roomCode);
      this.server.to(roomCode).emit('telepathie:room-update', this.telepathie.toDTO(room));
      this.openSousRound(room);
    } catch {
      // Room supprimée
    }
  }

  /** Ouvre un sous-round : met à jour `roundTimerEndsAt`, émet `input-open` et arme le timer. */
  private openSousRound(room: TelepathieRoomInternal): void {
    const endsAt = Date.now() + room.settings.roundTimerSeconds * 1000;
    room.roundTimerEndsAt = endsAt;
    this.server.to(room.code).emit('telepathie:input-open', { endsAt });
    this.timerService.startRoundTimer(room.code, room.settings.roundTimerSeconds, () => {
      this.resolveRound(room.code);
    });
  }

  private resolveRound(roomCode: string): void {
    try {
      const { room, roundResult, mancheOver, mancheResult, gameOver } =
        this.telepathie.resolveRound(roomCode);

      // Toujours émettre le résultat du sous-round
      this.server.to(roomCode).emit('telepathie:round-result', roundResult);
      this.server.to(roomCode).emit('telepathie:room-update', this.telepathie.toDTO(room));

      if (mancheOver && mancheResult) {
        this.server.to(roomCode).emit('telepathie:manche-result', mancheResult);

        if (gameOver) {
          // Dernière manche : podium après délai
          const rankings = this.telepathie.buildRankings(room);
          const handle = setTimeout(() => {
            this.server.to(roomCode).emit('telepathie:game-finished', { rankings });
          }, 5000);
          handle.unref();
        }
        // Sinon, on attend que l'hôte appelle next-manche
      } else {
        // Pas de match, manche continue : auto-start le sous-round suivant après 3s
        this.timerService.startAutoNextTimer(roomCode, AUTO_NEXT_DELAY_MS, () => {
          try {
            const updatedRoom = this.telepathie.startNextSousRound(roomCode);
            this.openSousRound(updatedRoom);
            this.server
              .to(roomCode)
              .emit('telepathie:room-update', this.telepathie.toDTO(updatedRoom));
          } catch {
            // Room peut avoir disparu
          }
        });
      }
    } catch {
      // Room supprimée (tout le monde parti)
    }
  }

  private emitError(client: TypedSocket, e: unknown): void {
    const code = extractErrorCode(e);
    client.emit('telepathie:error', { code, message: code });
  }
}
