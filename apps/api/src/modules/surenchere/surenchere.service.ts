import { Injectable } from '@nestjs/common';
import {
  PlayerStatus,
  SurenchereRoom,
  SurencherePlayer,
  SurenchereRoundResult,
} from '@wiki-race/shared';
import { randomUUID } from 'crypto';
import { SurenchereRegistryService } from './surenchere-registry.service';
import { pickRandomChallenges } from './challenges.data';

const MAX_PLAYERS = 8;
const DEFAULT_ROUNDS = 3;
const DEFAULT_START_BID = 1;
const CHALLENGE_OPTIONS_COUNT = 3;

@Injectable()
export class SurenchereService {
  constructor(private readonly registry: SurenchereRegistryService) {}

  createRoom(
    socketId: string,
    pseudo: string,
    settings: Partial<{ totalRounds: number; startBid: number }> = {},
  ): SurenchereRoom {
    const code = this.registry.generateCode();
    const host: SurencherePlayer = {
      socketId,
      pseudo,
      score: 0,
      isHost: true,
      status: PlayerStatus.CONNECTED,
    };
    return this.registry.createRoom(
      code,
      host,
      settings.totalRounds ?? DEFAULT_ROUNDS,
      settings.startBid ?? DEFAULT_START_BID,
    );
  }

  seedRoom(
    code: string,
    players: Array<{ pseudo: string; isHost: boolean }>,
    settings: Partial<{ totalRounds: number; startBid: number }> = {},
  ): void {
    const hostPlayer = players.find((p) => p.isHost) ?? players[0];
    const host: SurencherePlayer = {
      socketId: `seed-${hostPlayer.pseudo}`,
      pseudo: hostPlayer.pseudo,
      score: 0,
      isHost: true,
      status: PlayerStatus.DISCONNECTED,
    };
    this.registry.createRoom(
      code,
      host,
      settings.totalRounds ?? DEFAULT_ROUNDS,
      settings.startBid ?? DEFAULT_START_BID,
    );
    for (const p of players.filter((pl) => !pl.isHost)) {
      this.registry.addPlayer(code, {
        socketId: `seed-${p.pseudo}`,
        pseudo: p.pseudo,
        score: 0,
        isHost: false,
        status: PlayerStatus.DISCONNECTED,
      });
    }
  }

  joinRoom(socketId: string, roomCode: string, pseudo: string): SurenchereRoom {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const existing = room.players.find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    if (existing) {
      this.registry.rebindSocket(existing.socketId, socketId, roomCode);
      existing.status = PlayerStatus.CONNECTED;
      return room;
    }

    if (room.phase !== 'WAITING') throw new Error('GAME_IN_PROGRESS');
    if (room.players.length >= MAX_PLAYERS) throw new Error('ROOM_FULL');
    if (room.players.some((p) => p.pseudo === pseudo)) throw new Error('PSEUDO_TAKEN');

    const player: SurencherePlayer = {
      socketId,
      pseudo,
      score: 0,
      isHost: false,
      status: PlayerStatus.CONNECTED,
    };
    this.registry.addPlayer(roomCode, player);
    return room;
  }

  leaveRoom(socketId: string): { room: SurenchereRoom | null; wasHost: boolean; deleted: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) return { room: null, wasHost: false, deleted: true };
    const player = room.players.find((p) => p.socketId === socketId);
    const wasHost = !!player?.isHost;
    this.registry.removePlayer(room.code, socketId);
    if (room.players.length === 0) {
      this.registry.deleteRoom(room.code);
      return { room: null, wasHost, deleted: true };
    }
    if (wasHost) {
      room.players[0].isHost = true;
    }
    return { room, wasHost, deleted: false };
  }

  markDisconnected(socketId: string): SurenchereRoom | null {
    return this.registry.markDisconnected(socketId);
  }

  updateSettings(
    socketId: string,
    settings: { totalRounds: number; startBid: number },
  ): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player?.isHost) throw new Error('NOT_HOST');
    if (room.phase !== 'WAITING') throw new Error('GAME_IN_PROGRESS');
    room.settings.totalRounds = settings.totalRounds;
    room.settings.startBid = settings.startBid;
    return room;
  }

  startGame(socketId: string): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player?.isHost) throw new Error('NOT_HOST');
    if (room.players.length < 2) throw new Error('NOT_ENOUGH_PLAYERS');
    if (room.phase !== 'WAITING' && room.phase !== 'FINISHED') {
      throw new Error('GAME_IN_PROGRESS');
    }
    room.currentRound = 1;
    room.roundStarterIndex = 0;
    for (const p of room.players) p.score = 0;
    this.initRound(room);
    return room;
  }

  private initRound(room: SurenchereRoom): void {
    room.challengeOptions = pickRandomChallenges(CHALLENGE_OPTIONS_COUNT);
    room.challengeChooserSocketId =
      room.players[room.roundStarterIndex % room.players.length]?.socketId ?? null;
    room.currentChallenge = null;
    room.currentBid = 0;
    room.currentBidderSocketId = null;
    room.passedSocketIds = [];
    room.currentWords = null;
    room.wasForced = false;
    room.voteMap = {};
    room.chooseTimerEndsAt = null;
    room.bidTimerEndsAt = null;
    room.wordsTimerEndsAt = null;
    room.phase = 'CHOOSING_CHALLENGE';
  }

  autoChooseChallenge(roomCode: string): SurenchereRoom {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'CHOOSING_CHALLENGE') throw new Error('NOT_CHOOSING');
    const picked = room.challengeOptions[0];
    if (!picked) throw new Error('NO_CHALLENGE_OPTIONS');
    room.currentChallenge = { ...picked };
    room.challengeOptions = [];
    room.chooseTimerEndsAt = null;
    room.phase = 'BIDDING';
    return room;
  }

  chooseChallenge(
    socketId: string,
    options: { challengeId?: string; customPhrase?: string },
  ): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'CHOOSING_CHALLENGE') throw new Error('NOT_CHOOSING');
    if (room.challengeChooserSocketId !== socketId) throw new Error('NOT_CHOOSER');

    if (options.customPhrase !== undefined) {
      const phrase = options.customPhrase.trim();
      if (phrase.length < 5) throw new Error('CUSTOM_PHRASE_TOO_SHORT');
      if (phrase.length > 200) throw new Error('CUSTOM_PHRASE_TOO_LONG');
      room.currentChallenge = {
        id: randomUUID(),
        category: '✏️ Défi custom',
        prompt: phrase,
        source: 'custom',
      };
    } else if (options.challengeId !== undefined) {
      const picked = room.challengeOptions.find((c) => c.id === options.challengeId);
      if (!picked) throw new Error('CHALLENGE_NOT_FOUND');
      room.currentChallenge = { ...picked };
    } else {
      throw new Error('MISSING_CHALLENGE_OPTION');
    }

    room.challengeOptions = [];
    room.phase = 'BIDDING';
    return room;
  }

  placeBid(socketId: string, amount: number): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'BIDDING') throw new Error('NOT_BIDDING');
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (room.passedSocketIds.includes(socketId)) throw new Error('ALREADY_PASSED');
    if (amount <= room.currentBid) throw new Error('BID_TOO_LOW');
    if (room.currentBidderSocketId === socketId) throw new Error('CANNOT_BID_ON_SELF');
    room.currentBid = amount;
    room.currentBidderSocketId = socketId;
    return room;
  }

  pass(socketId: string): { room: SurenchereRoom; allPassed: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'BIDDING') throw new Error('NOT_BIDDING');
    if (socketId === room.currentBidderSocketId) throw new Error('BIDDER_CANNOT_PASS');
    if (!room.passedSocketIds.includes(socketId)) room.passedSocketIds.push(socketId);

    const others = room.players.filter(
      (p) => p.status === PlayerStatus.CONNECTED && p.socketId !== room.currentBidderSocketId,
    );
    const allPassed =
      room.currentBidderSocketId !== null &&
      others.length > 0 &&
      others.every((p) => room.passedSocketIds.includes(p.socketId));

    if (allPassed) {
      // Only mark as forced when 2+ opponents all passed — 1 passer is just normal play
      room.wasForced = others.length >= 2;
      room.phase = 'WORDS';
      return { room, allPassed };
    }

    // No bidder yet but every connected player has passed → last passer is forced
    if (!room.currentBidderSocketId) {
      const allConnected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
      const everyonePassed =
        allConnected.length > 0 &&
        allConnected.every((p) => room.passedSocketIds.includes(p.socketId));

      if (everyonePassed) {
        room.currentBid = room.settings.startBid;
        room.currentBidderSocketId = socketId;
        room.passedSocketIds = room.passedSocketIds.filter((id) => id !== socketId);
        room.wasForced = true;
        room.phase = 'WORDS';
        return { room, allPassed: true };
      }
    }

    return { room, allPassed };
  }

  triggerChallenge(socketId: string): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'BIDDING') throw new Error('NOT_BIDDING');
    if (room.currentBidderSocketId !== socketId) throw new Error('NOT_CURRENT_BIDDER');
    room.wasForced = false;
    room.phase = 'WORDS';
    return room;
  }

  submitWords(socketId: string, words: string[]): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'WORDS') throw new Error('NOT_IN_WORDS');
    if (room.currentBidderSocketId !== socketId) throw new Error('NOT_CURRENT_BIDDER');
    const cleaned = words.map((w) => w.trim()).filter((w) => w.length > 0);
    if (cleaned.length < room.currentBid) throw new Error('NOT_ENOUGH_WORDS');
    room.currentWords = cleaned;
    room.voteMap = {};
    room.phase = 'VOTING';
    return room;
  }

  vote(
    socketId: string,
    accept: boolean,
  ): {
    room: SurenchereRoom;
    resolved: boolean;
    result?: SurenchereRoundResult;
    finished?: boolean;
    scores?: Record<string, number>;
  } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'VOTING') throw new Error('NOT_VOTING');
    if (socketId === room.currentBidderSocketId) throw new Error('BIDDER_CANNOT_VOTE');
    if (room.voteMap[socketId] !== undefined) throw new Error('ALREADY_VOTED');

    room.voteMap[socketId] = accept;
    return this.tryResolveVoting(room);
  }

  tryResolveVoting(room: SurenchereRoom): {
    room: SurenchereRoom;
    resolved: boolean;
    result?: SurenchereRoundResult;
    finished?: boolean;
    scores?: Record<string, number>;
  } {
    if (room.phase !== 'VOTING' || !room.currentWords) return { room, resolved: false };

    const eligibleVoters = room.players.filter(
      (p) => p.status === PlayerStatus.CONNECTED && p.socketId !== room.currentBidderSocketId,
    );

    // If no eligible voters remain, auto-resolve with all words rejected
    const allVoted =
      eligibleVoters.length === 0 ||
      eligibleVoters.every((p) => room.voteMap[p.socketId] !== undefined);

    if (!allVoted) return { room, resolved: false };

    // Majority of eligible voters accepting → accepted (tie = rejected)
    const acceptCount = Object.values(room.voteMap).filter(Boolean).length;
    const accepted = acceptCount > eligibleVoters.length / 2;

    // Block vote: binary verdict — all words accepted or all rejected
    // Note: missingCount is therefore always 0 or currentBid.
    const wordVerdicts = room.currentWords.map(() => accepted);
    const success = accepted;
    const { result, finished } = this.applyVerdictResult(room, success, wordVerdicts);
    const scores = this.toScores(room);
    return { room, resolved: true, result, finished, scores };
  }

  private applyVerdictResult(
    room: SurenchereRoom,
    success: boolean,
    wordVerdicts: boolean[],
  ): { result: SurenchereRoundResult; finished: boolean } {
    if (!room.currentChallenge || !room.currentBidderSocketId) {
      throw new Error('INVALID_STATE');
    }
    const bidder = room.players.find((p) => p.socketId === room.currentBidderSocketId);
    if (!bidder) throw new Error('BIDDER_NOT_FOUND');

    const validatedCount = wordVerdicts.filter(Boolean).length;
    const missingCount = room.currentBid - validatedCount;

    let scoreDelta: number;
    if (missingCount === 0) {
      // Full success: award the bid (+1 bonus if forced)
      scoreDelta = room.currentBid + (room.wasForced ? 1 : 0);
    } else if (missingCount < room.currentBid) {
      // Partial failure: -1 per missing word.
      // Note: unreachable with block vote (missingCount is always 0 or currentBid).
      scoreDelta = -1 * missingCount;
    } else {
      // Total failure: no penalty
      scoreDelta = 0;
    }
    bidder.score += scoreDelta;

    const result: SurenchereRoundResult = {
      bidderSocketId: bidder.socketId,
      bidderPseudo: bidder.pseudo,
      challenge: room.currentChallenge,
      bid: room.currentBid,
      success,
      scoreDelta,
      missingCount,
      words: room.currentWords ? [...room.currentWords] : [],
      wordVerdicts,
      wasForced: room.wasForced,
    };
    room.lastRoundResult = result;
    room.phase = 'ROUND_END';

    const finished = room.currentRound >= room.settings.totalRounds;
    if (finished) room.phase = 'FINISHED';
    return { result, finished };
  }

  nextRound(socketId: string): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'ROUND_END') throw new Error('NOT_AT_ROUND_END');
    room.currentRound += 1;
    room.roundStarterIndex = (room.roundStarterIndex + 1) % room.players.length;
    this.initRound(room);
    return room;
  }

  resetRoom(socketId: string): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    const caller = room.players.find((p) => p.socketId === socketId);
    if (!caller?.isHost) throw new Error('NOT_HOST');
    room.phase = 'WAITING';
    room.currentRound = 0;
    room.currentChallenge = null;
    room.challengeOptions = [];
    room.challengeChooserSocketId = null;
    room.currentBid = 0;
    room.currentBidderSocketId = null;
    room.passedSocketIds = [];
    room.currentWords = null;
    room.wasForced = false;
    room.voteMap = {};
    room.bidTimerEndsAt = null;
    room.wordsTimerEndsAt = null;
    room.roundStarterIndex = 0;
    room.lastRoundResult = null;
    for (const p of room.players) p.score = 0;
    return room;
  }

  getRoomBySocket(socketId: string): SurenchereRoom | undefined {
    return this.registry.findRoomBySocketId(socketId);
  }

  getRoomByCode(code: string): SurenchereRoom | undefined {
    return this.registry.findRoom(code);
  }

  /** Called when the bid timer expires: force current bidder to WORDS phase. */
  forceToWords(code: string): SurenchereRoom | null {
    const room = this.registry.findRoom(code);
    if (!room || room.phase !== 'BIDDING' || !room.currentBidderSocketId) return null;
    room.wasForced = true;
    room.bidTimerEndsAt = null;
    room.phase = 'WORDS';
    return room;
  }

  /** Called when the words timer expires: submit empty words and move to VOTING. */
  autoSubmitWords(socketId: string): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'WORDS') throw new Error('NOT_IN_WORDS');
    if (room.currentBidderSocketId !== socketId) throw new Error('NOT_CURRENT_BIDDER');
    room.currentWords = [];
    room.voteMap = {};
    room.wordsTimerEndsAt = null;
    room.phase = 'VOTING';
    return room;
  }

  toScores(room: SurenchereRoom): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const p of room.players) scores[p.pseudo] = p.score;
    return scores;
  }

  rankPlayers(room: SurenchereRoom): SurencherePlayer[] {
    return [...room.players].sort((a, b) => b.score - a.score);
  }
}
