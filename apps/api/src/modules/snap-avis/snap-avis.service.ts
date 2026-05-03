import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  PlayerStatus,
  SnapAvisSettings,
  SnapAvisRoundResult,
  SnapAvisRankEntry,
  SnapAvisRoomDTO,
  normalizeWord,
} from '@wiki-race/shared';
import { SnapAvisRegistryService } from './snap-avis-registry.service';
import { SnapAvisRoomInternal, SnapAvisPlayerInternal } from './snap-avis-room.types';
import { IMAGE_POOL, shuffleImages } from './images.data';
import { assertBounds } from '../../common/game-room';

const MAX_PLAYERS = 8;
const MAX_WORD_LENGTH = 100;

@Injectable()
export class SnapAvisService {
  constructor(private readonly registry: SnapAvisRegistryService) {}

  createRoom(
    socketId: string,
    pseudo: string,
  ): { room: SnapAvisRoomInternal; sessionToken: string } {
    const code = this.registry.generateCode();
    const host: SnapAvisPlayerInternal = {
      socketId,
      pseudo,
      score: 0,
      isHost: true,
      status: PlayerStatus.CONNECTED,
      hasSubmitted: false,
      currentWord: null,
      sessionToken: randomUUID(),
    };
    return { room: this.registry.createRoom(code, host), sessionToken: host.sessionToken! };
  }

  joinRoom(
    socketId: string,
    roomCode: string,
    pseudo: string,
    sessionToken?: string,
  ): { room: SnapAvisRoomInternal; sessionToken: string } {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    // Reconnect: rebind same pseudo
    const existing = room.players.find((p) => p.pseudo === pseudo);
    if (existing) {
      const isReclaim = existing.status === PlayerStatus.DISCONNECTED;
      if (isReclaim) {
        if (existing.sessionToken !== null && sessionToken !== existing.sessionToken) {
          throw new Error('INVALID_SESSION_TOKEN');
        }
        if (existing.sessionToken === null) existing.sessionToken = randomUUID();
      }
      this.registry.rebindSocket(existing.socketId, socketId, roomCode);
      existing.socketId = socketId;
      existing.status = PlayerStatus.CONNECTED;
      return { room, sessionToken: existing.sessionToken ?? '' };
    }

    if (room.phase !== 'WAITING') throw new Error('GAME_IN_PROGRESS');
    if (room.players.length >= MAX_PLAYERS) throw new Error('ROOM_FULL');

    const player: SnapAvisPlayerInternal = {
      socketId,
      pseudo,
      score: 0,
      isHost: false,
      status: PlayerStatus.CONNECTED,
      hasSubmitted: false,
      currentWord: null,
      sessionToken: randomUUID(),
    };
    this.registry.addPlayer(roomCode, player);
    return { room, sessionToken: player.sessionToken! };
  }

  leaveRoom(socketId: string): { room: SnapAvisRoomInternal | null; deleted: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) return { room: null, deleted: true };

    this.registry.removePlayer(room.code, socketId);

    if (room.players.length === 0) {
      this.registry.deleteRoom(room.code);
      return { room: null, deleted: true };
    }

    if (room.hostSocketId === socketId) {
      const newHost = room.players.find((p) => p.status === PlayerStatus.CONNECTED);
      if (newHost) {
        newHost.isHost = true;
        room.hostSocketId = newHost.socketId;
      }
    }

    return { room, deleted: false };
  }

  startGame(socketId: string, settings?: Partial<SnapAvisSettings>): SnapAvisRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');

    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    if (connected.length < 2) throw new Error('NOT_ENOUGH_PLAYERS');

    if (settings?.totalRounds !== undefined) {
      assertBounds(settings.totalRounds, 1, 20, 'INVALID_TOTAL_ROUNDS');
      room.settings.totalRounds = settings.totalRounds;
    }
    if (settings?.revealDurationMs !== undefined) {
      assertBounds(settings.revealDurationMs, 500, 30_000, 'INVALID_REVEAL_DURATION');
      room.settings.revealDurationMs = settings.revealDurationMs;
    }
    if (settings?.writingDurationMs !== undefined) {
      assertBounds(settings.writingDurationMs, 5_000, 60_000, 'INVALID_WRITING_DURATION');
      room.settings.writingDurationMs = settings.writingDurationMs;
    }

    const totalRounds = room.settings.totalRounds;
    const shuffled = shuffleImages(IMAGE_POOL);
    // Pick enough images, wrap around if pool is smaller than rounds
    const queue: typeof shuffled = [];
    for (let i = 0; i < totalRounds; i++) {
      queue.push(shuffled[i % shuffled.length]);
    }

    // Reserve first image, rest stays in queue
    const firstImage = queue.shift()!;

    room.imageQueue = queue;
    room.currentRound = 1;
    room.currentImage = firstImage;
    room.phase = 'REVEALING';
    room.roundResults = null;
    room.writingTimerEndsAt = null;

    for (const p of room.players) {
      p.currentWord = null;
      p.hasSubmitted = false;
      p.score = 0;
    }

    return room;
  }

  startNextRound(socketId: string): SnapAvisRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');

    const nextImage = room.imageQueue.shift();
    if (!nextImage) throw new Error('NO_MORE_ROUNDS');

    room.currentRound++;
    room.currentImage = nextImage;
    room.phase = 'REVEALING';
    room.roundResults = null;
    room.writingTimerEndsAt = null;

    for (const p of room.players) {
      p.currentWord = null;
      p.hasSubmitted = false;
    }

    return room;
  }

  setWritingPhase(roomCode: string, endsAt: number): SnapAvisRoomInternal {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    room.phase = 'WRITING';
    room.writingTimerEndsAt = endsAt;
    return room;
  }

  submitWord(
    socketId: string,
    word: string,
  ): { room: SnapAvisRoomInternal; allSubmitted: boolean; pseudo: string } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'WRITING') throw new Error('WRONG_PHASE');
    if (typeof word !== 'string' || word.length > MAX_WORD_LENGTH) {
      throw new Error('WORD_TOO_LONG');
    }

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (player.hasSubmitted) {
      // Idempotent — already submitted, return current state
      const activePlayers = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
      const allSubmitted = activePlayers.every((p) => p.hasSubmitted);
      return { room, allSubmitted, pseudo: player.pseudo };
    }

    player.currentWord = this.normalizeWord(word);
    player.hasSubmitted = true;

    const activePlayers = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    const allSubmitted = activePlayers.every((p) => p.hasSubmitted);

    return { room, allSubmitted, pseudo: player.pseudo };
  }

  resolveRound(roomCode: string): { room: SnapAvisRoomInternal; result: SnapAvisRoundResult } {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    room.phase = 'RESULTS';

    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    // N = tous les joueurs connectés (soumis ou non) — utilisé pour la formule de rareté
    const N = connected.length;

    const submitters = connected.filter((p) => p.hasSubmitted);

    const groups: Record<string, string[]> = {};
    const words: Record<string, string> = {};

    // Inclut tous les connectés dans words — vide pour ceux qui n'ont pas soumis
    for (const p of connected) {
      words[p.pseudo] = p.currentWord ?? '';
    }

    // Groupes uniquement sur les soumissions réelles
    for (const p of submitters) {
      const w = p.currentWord ?? '';
      if (!groups[w]) groups[w] = [];
      groups[w].push(p.pseudo);
    }

    const scores: Record<string, number> = {};

    for (const [, pseudos] of Object.entries(groups)) {
      const G = pseudos.length;
      let pts: number;

      if (G === 1) {
        pts = 0;
      } else if (G === N) {
        // Tous les connectés ont soumis le même mot
        pts = 1;
      } else {
        pts = Math.round(10 / (G - 1));
      }

      for (const pseudo of pseudos) {
        scores[pseudo] = pts;
        const player = room.players.find((p) => p.pseudo === pseudo);
        if (player) player.score += pts;
      }
    }

    // Joueurs qui n'ont pas soumis → 0 (sans modifier leur score total)
    for (const p of connected) {
      if (!(p.pseudo in scores)) scores[p.pseudo] = 0;
    }

    const result: SnapAvisRoundResult = {
      imageUrl: room.currentImage?.url ?? '',
      words,
      groups,
      scores,
    };

    room.roundResults = result;

    return { room, result };
  }

  isGameOver(room: SnapAvisRoomInternal): boolean {
    return room.imageQueue.length === 0;
  }

  buildRankings(room: SnapAvisRoomInternal): SnapAvisRankEntry[] {
    const sorted = [...room.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.pseudo.localeCompare(b.pseudo);
    });

    let rank = 1;
    return sorted.map((p, i) => {
      if (i > 0 && sorted[i - 1].score !== p.score) rank = i + 1;
      return { pseudo: p.pseudo, score: p.score, rank };
    });
  }

  getRoomBySocket(socketId: string): SnapAvisRoomInternal | undefined {
    return this.registry.findRoomBySocketId(socketId);
  }

  markDisconnected(socketId: string): SnapAvisRoomInternal | null {
    return this.registry.markDisconnected(socketId);
  }

  /**
   * Returns the previous socketId of a DISCONNECTED player matching `pseudo`,
   * or null if none. Used by the gateway to clear the ghost-purge timer keyed
   * by the old socket id on reconnect (the new socket never had a timer).
   */
  findReconnectSocketId(roomCode: string, pseudo: string): string | null {
    const room = this.registry.findRoom(roomCode);
    if (!room) return null;
    const existing = room.players.find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    return existing?.socketId ?? null;
  }

  /**
   * Pré-rempli la room depuis le CommonLobby. Appelé avant le redirect lobby:redirect.
   * La room est créée avec tous les joueurs en état DISCONNECTED — ils rejoindront ensuite
   * via snapavis:join déclenché par le redirect.
   */
  seedRoom(code: string, players: Array<{ pseudo: string; isHost: boolean }>): void {
    this.registry.deleteRoom(code);
    const hostData = players.find((p) => p.isHost) ?? players[0];
    const host: SnapAvisPlayerInternal = {
      socketId: `seed-${hostData.pseudo}`,
      pseudo: hostData.pseudo,
      score: 0,
      isHost: true,
      status: PlayerStatus.DISCONNECTED,
      hasSubmitted: false,
      currentWord: null,
      sessionToken: null,
    };
    this.registry.createRoom(code, host);

    for (const p of players) {
      if (p.pseudo === hostData.pseudo) continue;
      this.registry.addPlayer(code, {
        socketId: `seed-${p.pseudo}`,
        pseudo: p.pseudo,
        score: 0,
        isHost: false,
        status: PlayerStatus.DISCONNECTED,
        hasSubmitted: false,
        currentWord: null,
        sessionToken: null,
      });
    }
  }

  /** Convertit l'état interne en DTO wire-safe (sans currentWord, sans imageQueue). */
  toDTO(room: SnapAvisRoomInternal): SnapAvisRoomDTO {
    return {
      code: room.code,
      hostSocketId: room.hostSocketId,
      players: room.players.map((p) => ({
        socketId: p.socketId,
        pseudo: p.pseudo,
        score: p.score,
        status: p.status,
        isHost: p.isHost,
        hasSubmitted: p.hasSubmitted,
      })),
      phase: room.phase,
      settings: { ...room.settings },
      currentRound: room.currentRound,
      currentImage: room.currentImage,
      roundResults: room.roundResults,
      writingTimerEndsAt: room.writingTimerEndsAt,
    };
  }

  private normalizeWord(word: string): string {
    return normalizeWord(word);
  }

  getPseudo(socketId: string): string {
    const room = this.registry.findRoomBySocketId(socketId);
    return room?.players.find((p) => p.socketId === socketId)?.pseudo ?? '';
  }

  updateSettings(socketId: string, settings: Partial<SnapAvisSettings>): SnapAvisRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    if (room.phase !== 'WAITING') throw new Error('GAME_ALREADY_STARTED');

    if (settings.totalRounds !== undefined)
      room.settings.totalRounds = Math.max(1, Math.min(20, settings.totalRounds));
    if (settings.writingDurationMs !== undefined)
      room.settings.writingDurationMs = Math.max(5000, Math.min(30000, settings.writingDurationMs));

    return room;
  }

  resetRoom(socketId: string): SnapAvisRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');

    room.phase = 'WAITING';
    room.currentRound = 0;
    room.currentImage = null;
    room.roundResults = null;
    room.writingTimerEndsAt = null;
    room.imageQueue = [];

    for (const p of room.players) {
      p.currentWord = null;
      p.hasSubmitted = false;
      p.score = 0;
      p.status = PlayerStatus.CONNECTED;
    }

    return room;
  }
}
