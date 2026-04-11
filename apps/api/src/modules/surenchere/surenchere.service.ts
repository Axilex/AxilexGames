import { Injectable } from '@nestjs/common';
import {
  PlayerStatus,
  SurenchereRoom,
  SurencherePlayer,
  SurenchereRoundResult,
} from '@wiki-race/shared';
import { SurenchereRegistryService } from './surenchere-registry.service';
import { pickRandomChallenges } from './challenges.data';

const MAX_PLAYERS = 8;
const DEFAULT_ROUNDS = 5;
const DEFAULT_START_BID = 5;
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
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) return null;
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) player.status = PlayerStatus.DISCONNECTED;
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
    room.phase = 'CHOOSING_CHALLENGE';
  }

  chooseChallenge(socketId: string, challengeId: string): SurenchereRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'CHOOSING_CHALLENGE') throw new Error('NOT_CHOOSING');
    if (room.challengeChooserSocketId !== socketId) throw new Error('NOT_CHOOSER');
    const picked = room.challengeOptions.find((c) => c.id === challengeId);
    if (!picked) throw new Error('CHALLENGE_NOT_FOUND');
    room.currentChallenge = picked;
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
      (p) =>
        p.status === PlayerStatus.CONNECTED && p.socketId !== room.currentBidderSocketId,
    );
    const allPassed =
      room.currentBidderSocketId !== null &&
      others.length > 0 &&
      others.every((p) => room.passedSocketIds.includes(p.socketId));

    if (allPassed) {
      room.wasForced = true;
      room.phase = 'WORDS';
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
    room.phase = 'VERDICT';
    return room;
  }

  resolveVerdict(
    socketId: string,
    success: boolean,
  ): { room: SurenchereRoom; result: SurenchereRoundResult; finished: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    const caller = room.players.find((p) => p.socketId === socketId);
    if (!caller?.isHost) throw new Error('NOT_HOST');
    if (room.phase !== 'VERDICT') throw new Error('NOT_IN_VERDICT');
    if (!room.currentChallenge || !room.currentBidderSocketId) {
      throw new Error('INVALID_STATE');
    }

    const bidder = room.players.find((p) => p.socketId === room.currentBidderSocketId);
    if (!bidder) throw new Error('BIDDER_NOT_FOUND');

    const forcedBonus = success && room.wasForced ? room.passedSocketIds.length : 0;
    const delta = success ? room.currentBid + forcedBonus : -room.currentBid;
    bidder.score += delta;

    const result: SurenchereRoundResult = {
      bidderSocketId: bidder.socketId,
      bidderPseudo: bidder.pseudo,
      challenge: room.currentChallenge,
      bid: room.currentBid,
      success,
      pointsDelta: delta,
      words: room.currentWords ? [...room.currentWords] : [],
      forcedBonus,
    };
    room.lastRoundResult = result;
    room.phase = 'ROUND_END';

    const finished = room.currentRound >= room.settings.totalRounds;
    if (finished) {
      room.phase = 'FINISHED';
    }
    return { room, result, finished };
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
    room.roundStarterIndex = 0;
    room.lastRoundResult = null;
    for (const p of room.players) p.score = 0;
    return room;
  }

  getRoomBySocket(socketId: string): SurenchereRoom | undefined {
    return this.registry.findRoomBySocketId(socketId);
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
