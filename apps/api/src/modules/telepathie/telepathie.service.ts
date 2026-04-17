import { Injectable } from '@nestjs/common';
import {
  PlayerStatus,
  TelepathieSettings,
  TelepathieSousRoundResult,
  TelepathieMancheResult,
  TelepathieRankEntry,
  TelepathieRoomDTO,
} from '@wiki-race/shared';
import { TelepathieRegistryService } from './telepathie-registry.service';
import { TelepathieRoomInternal, TelepathiePlayerInternal } from './telepathie-room.types';
import { DEFAULT_TELEPATHIE_SETTINGS, getWordPool, shuffle } from './words.data';

const MAX_PLAYERS = 8;

@Injectable()
export class TelepathieService {
  constructor(private readonly registry: TelepathieRegistryService) {}

  createRoom(socketId: string, pseudo: string): TelepathieRoomInternal {
    const code = this.registry.generateCode();
    const host: TelepathiePlayerInternal = this.makePlayer(pseudo, socketId, true);
    return this.registry.createRoom(code, host);
  }

  joinRoom(socketId: string, roomCode: string, pseudo: string): TelepathieRoomInternal {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const existing = room.players.find((p) => p.pseudo === pseudo);
    if (existing) {
      this.registry.rebindSocket(existing.socketId, socketId, roomCode);
      existing.socketId = socketId;
      existing.status = PlayerStatus.CONNECTED;
      return room;
    }

    if (room.phase !== 'WAITING') throw new Error('GAME_IN_PROGRESS');
    if (room.players.length >= MAX_PLAYERS) throw new Error('ROOM_FULL');

    const player: TelepathiePlayerInternal = this.makePlayer(pseudo, socketId, false);
    this.registry.addPlayer(roomCode, player);
    return room;
  }

  leaveRoom(socketId: string): { room: TelepathieRoomInternal | null; deleted: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) return { room: null, deleted: true };

    this.registry.removePlayer(room.code, socketId);

    if (room.players.length === 0) {
      this.registry.deleteRoom(room.code);
      return { room: null, deleted: true };
    }

    this.registry.transferHostIfNeeded(room, socketId);
    return { room, deleted: false };
  }

  /** Lance la partie : assigne les mots et démarre la manche 1 sous-round 1. */
  startGame(socketId: string, settings?: Partial<TelepathieSettings>): TelepathieRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');

    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    if (connected.length < 2) throw new Error('NOT_ENOUGH_PLAYERS');

    room.settings = { ...DEFAULT_TELEPATHIE_SETTINGS, ...settings };
    room.currentManche = 1;
    room.currentSousRound = 1;
    room.mancheResults = [];
    room.sousRoundHistory = [];
    room.lastRoundResult = null;
    room.roundTimerEndsAt = null;

    for (const p of room.players) {
      p.score = 0;
      p.currentWord = null;
      p.submittedWord = null;
      p.submittedWordDisplay = null;
      p.hasSubmitted = false;
      p.usedWords = [];
      p.status = PlayerStatus.CONNECTED;
    }

    room.phase = 'CHOOSING';

    return room;
  }

  /** Soumission d'un mot pendant un sous-round. */
  submitWord(
    socketId: string,
    word: string,
  ): { room: TelepathieRoomInternal; allSubmitted: boolean; pseudo: string } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'PLAYING') throw new Error('WRONG_PHASE');

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');

    if (player.hasSubmitted) {
      const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
      const allSubmitted = connected.every((p) => p.hasSubmitted);
      return { room, allSubmitted, pseudo: player.pseudo };
    }

    const normalized = this.normalizeWord(word);
    if (player.usedWords.includes(normalized)) {
      throw new Error('DUPLICATE_WORD');
    }

    player.submittedWord = normalized;
    player.submittedWordDisplay = word.trim();
    player.hasSubmitted = true;
    player.usedWords.push(normalized);

    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    const allSubmitted = connected.every((p) => p.hasSubmitted);

    return { room, allSubmitted, pseudo: player.pseudo };
  }

  /**
   * Résout un sous-round.
   * Retourne le résultat + si la manche est terminée + si c'est la fin du jeu.
   */
  resolveRound(roomCode: string): {
    room: TelepathieRoomInternal;
    roundResult: TelepathieSousRoundResult;
    mancheOver: boolean;
    mancheResult: TelepathieMancheResult | null;
    gameOver: boolean;
  } {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);

    // Regrouper les mots identiques
    const wordMap = new Map<string, string[]>();
    for (const player of connected) {
      const word = player.submittedWord ?? '__no_word__';
      if (!wordMap.has(word)) wordMap.set(word, []);
      wordMap.get(word)!.push(player.pseudo);
    }

    const winnerGroups = [...wordMap.values()].filter((g) => g.length >= 2);
    const hasMatch = winnerGroups.length > 0;

    const submissions: Record<string, string> = {};
    for (const player of connected) {
      // Utiliser la valeur avec accents pour l'affichage
      submissions[player.pseudo] = player.submittedWordDisplay ?? player.submittedWord ?? '';
    }

    const roundResult: TelepathieSousRoundResult = {
      manche: room.currentManche,
      sousRound: room.currentSousRound,
      submissions,
      winnerGroups,
      hasMatch,
    };

    room.lastRoundResult = roundResult;
    room.sousRoundHistory.push(roundResult);

    // Le mot soumis devient le mot courant pour le sous-round suivant (valeur d'affichage)
    for (const player of connected) {
      if (player.submittedWordDisplay !== null) {
        player.currentWord = player.submittedWordDisplay;
      } else if (player.submittedWord !== null) {
        player.currentWord = player.submittedWord;
      }
    }

    const mancheOver = hasMatch || room.currentSousRound >= room.settings.maxSousRounds;

    let mancheResult: TelepathieMancheResult | null = null;

    if (mancheOver) {
      // Attribuer 1 point par manche gagnée
      const winners = hasMatch ? winnerGroups.flat() : [];
      for (const player of connected) {
        if (winners.includes(player.pseudo)) {
          player.score += 1;
        }
      }

      mancheResult = {
        manche: room.currentManche,
        sousRoundsPlayed: room.currentSousRound,
        hasMatch,
        winners,
      };

      room.mancheResults.push(mancheResult);
      room.phase = 'MANCHE_RESULT';
      room.roundTimerEndsAt = null;
    } else {
      // Manche continue : incrémenter le sous-round
      room.currentSousRound++;
      room.phase = 'ROUND_RESULT';
      room.roundTimerEndsAt = null;
      this.resetSubmissions(room);
    }

    const gameOver = mancheOver && room.currentManche >= room.settings.totalManches;

    return { room, roundResult, mancheOver, mancheResult, gameOver };
  }

  /**
   * Démarre le sous-round suivant (dans la même manche).
   * Appelé automatiquement côté serveur après un ROUND_RESULT sans match.
   */
  startNextSousRound(roomCode: string): TelepathieRoomInternal {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    room.phase = 'PLAYING';
    return room;
  }

  /** Passe à la manche suivante (host uniquement). */
  nextManche(socketId: string): TelepathieRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    if (room.phase !== 'MANCHE_RESULT') throw new Error('WRONG_PHASE');

    if (room.currentManche >= room.settings.totalManches) {
      room.phase = 'FINISHED';
      return room;
    }

    room.currentManche++;
    room.currentSousRound = 1;
    room.lastRoundResult = null;
    room.roundTimerEndsAt = null;
    for (const p of room.players) {
      p.currentWord = null;
      p.submittedWord = null;
      p.submittedWordDisplay = null;
      p.hasSubmitted = false;
      p.usedWords = [];
    }
    room.phase = 'CHOOSING';

    return room;
  }

  /** Joueur choisit son mot de départ pendant la phase CHOOSING. */
  chooseWord(
    socketId: string,
    word: string,
  ): { room: TelepathieRoomInternal; allChosen: boolean; pseudo: string } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'CHOOSING') throw new Error('WRONG_PHASE');

    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');

    // Stocker la valeur d'affichage (avec accents) dans currentWord.
    // Le mot normalisé est ajouté à usedWords pour bloquer sa réutilisation en sous-round.
    player.currentWord = word.trim();
    const normalized = this.normalizeWord(word);
    if (!player.usedWords.includes(normalized)) {
      player.usedWords.push(normalized);
    }

    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    const allChosen = connected.every((p) => p.currentWord !== null);

    return { room, allChosen, pseudo: player.pseudo };
  }

  /**
   * Ouvre la manche : assigne un mot aléatoire aux joueurs sans mot,
   * remet les soumissions à zéro et passe en phase PLAYING.
   *
   * Si 2+ joueurs avaient choisi le même mot de départ, leur soumet directement le mot
   * afin que `resolveRound` détecte le match immédiatement (hasImmediateMatch = true).
   */
  openManche(roomCode: string): { room: TelepathieRoomInternal; hasImmediateMatch: boolean } {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    // Mots aléatoires pour ceux qui n'ont pas choisi
    const pool = getWordPool('all');
    const shuffled = shuffle([...pool]);
    let idx = 0;
    for (const player of room.players) {
      if (player.currentWord === null) {
        player.currentWord = shuffled[idx % shuffled.length];
        idx++;
      }
    }

    this.resetSubmissions(room);

    // Bloquer le mot de départ des joueurs qui ont eu un mot assigné aléatoirement
    // (les joueurs qui ont choisi ont déjà leur mot dans usedWords via chooseWord)
    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    for (const player of connected) {
      const normalized = this.normalizeWord(player.currentWord!);
      if (!player.usedWords.includes(normalized)) {
        player.usedWords.push(normalized);
      }
    }

    // Détecter un match immédiat : 2+ joueurs avec le même mot de départ
    const startingWordMap = new Map<string, string[]>();
    for (const player of connected) {
      const key = this.normalizeWord(player.currentWord!);
      if (!startingWordMap.has(key)) startingWordMap.set(key, []);
      startingWordMap.get(key)!.push(player.pseudo);
    }
    const hasImmediateMatch = [...startingWordMap.values()].some((g) => g.length >= 2);

    if (hasImmediateMatch) {
      // Pré-remplir les soumissions pour que resolveRound fonctionne normalement
      for (const player of connected) {
        player.submittedWord = this.normalizeWord(player.currentWord!);
        player.submittedWordDisplay = player.currentWord;
        player.hasSubmitted = true;
      }
    }

    room.roundTimerEndsAt = null;
    room.phase = 'PLAYING';

    return { room, hasImmediateMatch };
  }

  isGameOver(room: TelepathieRoomInternal): boolean {
    return room.currentManche >= room.settings.totalManches;
  }

  buildRankings(room: TelepathieRoomInternal): TelepathieRankEntry[] {
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

  markDisconnected(socketId: string): TelepathieRoomInternal | null {
    return this.registry.markDisconnected(socketId);
  }

  getRoomBySocket(socketId: string): TelepathieRoomInternal | undefined {
    return this.registry.findRoomBySocketId(socketId);
  }

  getPseudo(socketId: string): string {
    const room = this.registry.findRoomBySocketId(socketId);
    return room?.players.find((p) => p.socketId === socketId)?.pseudo ?? '';
  }

  seedRoom(code: string, players: Array<{ pseudo: string; isHost: boolean }>): void {
    this.registry.deleteRoom(code);
    const hostData = players.find((p) => p.isHost) ?? players[0];
    const host: TelepathiePlayerInternal = {
      socketId: `seed-${hostData.pseudo}`,
      pseudo: hostData.pseudo,
      score: 0,
      isHost: true,
      status: PlayerStatus.DISCONNECTED,
      currentWord: null,
      hasSubmitted: false,
      submittedWord: null,
      submittedWordDisplay: null,
      usedWords: [],
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
        currentWord: null,
        hasSubmitted: false,
        submittedWord: null,
        submittedWordDisplay: null,
        usedWords: [],
      });
    }
  }

  resetRoom(socketId: string): TelepathieRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');

    room.phase = 'WAITING';
    room.currentManche = 0;
    room.currentSousRound = 0;
    room.mancheResults = [];
    room.sousRoundHistory = [];
    room.lastRoundResult = null;
    room.roundTimerEndsAt = null;

    for (const p of room.players) {
      p.score = 0;
      p.currentWord = null;
      p.submittedWord = null;
      p.submittedWordDisplay = null;
      p.hasSubmitted = false;
      p.usedWords = [];
      p.status = PlayerStatus.CONNECTED;
    }

    return room;
  }

  /** Convertit l'état interne en DTO wire-safe (sans submittedWord). */
  toDTO(room: TelepathieRoomInternal): TelepathieRoomDTO {
    return {
      code: room.code,
      hostSocketId: room.hostSocketId,
      players: room.players.map((p) => ({
        socketId: p.socketId,
        pseudo: p.pseudo,
        score: p.score,
        status: p.status,
        isHost: p.isHost,
        currentWord: p.currentWord,
        hasSubmitted: p.hasSubmitted,
      })),
      phase: room.phase,
      settings: { ...room.settings },
      currentManche: room.currentManche,
      currentSousRound: room.currentSousRound,
      mancheResults: room.mancheResults,
      sousRoundHistory: room.sousRoundHistory,
      lastRoundResult: room.lastRoundResult,
      roundTimerEndsAt: room.roundTimerEndsAt,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private makePlayer(pseudo: string, socketId: string, isHost: boolean): TelepathiePlayerInternal {
    return {
      socketId,
      pseudo,
      score: 0,
      status: PlayerStatus.CONNECTED,
      isHost,
      currentWord: null,
      hasSubmitted: false,
      submittedWord: null,
      submittedWordDisplay: null,
      usedWords: [],
    };
  }

  private assignWords(room: TelepathieRoomInternal): void {
    const pool = getWordPool('all');
    const shuffled = shuffle([...pool]);
    room.players.forEach((player, i) => {
      player.currentWord = shuffled[i % shuffled.length];
    });
  }

  private resetSubmissions(room: TelepathieRoomInternal): void {
    for (const player of room.players) {
      player.submittedWord = null;
      player.submittedWordDisplay = null;
      player.hasSubmitted = false;
    }
  }

  private normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
  }
}
