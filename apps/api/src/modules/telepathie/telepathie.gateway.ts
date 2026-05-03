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
  TelepathieCreatePayload,
  TelepathieJoinPayload,
  TelepathieStartPayload,
  TelepathieSubmitPayload,
  TelepathieChooseWordPayload,
} from '@wiki-race/shared';
import { TelepathieService } from './telepathie.service';
import { WsLoggingInterceptor } from '../../interceptors/ws-logging.interceptor';
import {
  GAME_GATEWAY_CONFIG,
  extractErrorCode,
  RoomTimerService,
  RECONNECT_TIMEOUT_MS,
} from '../../common/game-room';
import { TelepathieRoomInternal } from './telepathie-room.types';

/** Délai d'affichage du résultat avant de lancer le sous-round suivant (ms) */
const AUTO_NEXT_DELAY_MS = 3000;
/** Durée du timer de choix de mot en début de manche (s) */
const CHOOSE_TIMER_SECONDS = 30;

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

@UseInterceptors(WsLoggingInterceptor)
@WebSocketGateway(GAME_GATEWAY_CONFIG)
export class TelepathieGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: TypedServer;

  private readonly logger = new Logger(TelepathieGateway.name);

  constructor(
    private readonly telepathie: TelepathieService,
    private readonly timer: RoomTimerService,
  ) {}

  handleDisconnect(client: TypedSocket): void {
    const room = this.telepathie.markDisconnected(client.id);
    if (!room) return;
    this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));

    // Ghost purge: if the player does not reconnect within 30s, remove them from the room
    this.timer.start(client.id, 'reconnect', RECONNECT_TIMEOUT_MS, () => {
      if (!this.telepathie.getRoomBySocket(client.id)) return;
      const { room: updatedRoom, deleted } = this.telepathie.leaveRoom(client.id);
      if (deleted || !updatedRoom) return;
      this.timer.clearAll(updatedRoom.code);
      this.server
        .to(updatedRoom.code)
        .emit('telepathie:room-update', this.telepathie.toDTO(updatedRoom));
      // If all remaining players have submitted in the current sous-round, resolve it
      if (updatedRoom.phase === 'PLAYING') {
        const allSubmitted = updatedRoom.players
          .filter((p) => p.status === 'CONNECTED')
          .every((p) => p.submittedWord !== null);
        if (allSubmitted) {
          this.timer.clear(updatedRoom.code, 'round');
          this.resolveRound(updatedRoom.code);
        }
      }
    });
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
      const previousSocketId = this.telepathie.findReconnectSocketId(
        payload.roomCode,
        payload.pseudo,
      );
      const room = this.telepathie.joinRoom(client.id, payload.roomCode, payload.pseudo);
      if (previousSocketId) this.timer.clear(previousSocketId, 'reconnect');
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
        this.timer.clearAll(room.code);
        this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));
      }
    } catch (e) {
      this.logger.debug(`handleLeave swallowed: ${extractErrorCode(e)}`);
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
        this.timer.clear(room.code, 'choose');
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
        this.timer.clear(room.code, 'round');
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
      if (existing) this.timer.clear(existing.code, 'autoNext');

      const room = this.telepathie.nextManche(client.id);
      this.server.to(room.code).emit('telepathie:room-update', this.telepathie.toDTO(room));

      if (room.phase === 'CHOOSING') {
        this.openChoosing(room);
      } else if (room.phase === 'FINISHED') {
        const rankings = this.telepathie.buildRankings(room);
        this.timer.start(room.code, 'gameFinished', 3000, () => {
          this.server.to(room.code).emit('telepathie:game-finished', { rankings });
        });
      }
    } catch (e: unknown) {
      this.emitError(client, e);
    }
  }

  @SubscribeMessage('telepathie:reset')
  handleReset(@ConnectedSocket() client: TypedSocket): void {
    try {
      const existing = this.telepathie.getRoomBySocket(client.id);
      if (existing) this.timer.clearAll(existing.code);
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
    this.telepathie.setRoundTimerEndsAt(room.code, endsAt);
    this.server.to(room.code).emit('telepathie:choose-open', { endsAt });
    this.timer.start(room.code, 'choose', CHOOSE_TIMER_SECONDS * 1000, () => {
      this.startManche(room.code);
    });
  }

  /** Démarre la manche après la phase CHOOSING. */
  private startManche(roomCode: string): void {
    try {
      const { room, hasImmediateMatch } = this.telepathie.openManche(roomCode);
      this.server.to(roomCode).emit('telepathie:room-update', this.telepathie.toDTO(room));
      if (hasImmediateMatch) {
        // Résolution directe : les mots de départ matchent déjà
        this.resolveRound(room.code);
      } else {
        this.openSousRound(room);
      }
    } catch (e) {
      this.logger.debug(`startManche swallowed: ${extractErrorCode(e)}`);
    }
  }

  /** Ouvre un sous-round : met à jour `roundTimerEndsAt`, émet `input-open` et arme le timer. */
  private openSousRound(room: TelepathieRoomInternal): void {
    const endsAt = Date.now() + room.settings.roundTimerSeconds * 1000;
    this.telepathie.setRoundTimerEndsAt(room.code, endsAt);
    this.server.to(room.code).emit('telepathie:input-open', { endsAt });
    this.timer.start(room.code, 'round', room.settings.roundTimerSeconds * 1000, () => {
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
          this.timer.start(roomCode, 'gameFinished', 5000, () => {
            this.server.to(roomCode).emit('telepathie:game-finished', { rankings });
          });
        }
        // Sinon, on attend que l'hôte appelle next-manche
      } else {
        // Pas de match, manche continue : auto-start le sous-round suivant après 3s
        this.timer.start(roomCode, 'autoNext', AUTO_NEXT_DELAY_MS, () => {
          try {
            const updatedRoom = this.telepathie.startNextSousRound(roomCode);
            this.openSousRound(updatedRoom);
            this.server
              .to(roomCode)
              .emit('telepathie:room-update', this.telepathie.toDTO(updatedRoom));
          } catch (e) {
            this.logger.debug(`autoNext swallowed: ${extractErrorCode(e)}`);
          }
        });
      }
    } catch (e) {
      this.logger.debug(`resolveRound swallowed: ${extractErrorCode(e)}`);
    }
  }

  private emitError(client: TypedSocket, e: unknown): void {
    const code = extractErrorCode(e);
    client.emit('telepathie:error', { code, message: code });
  }
}
