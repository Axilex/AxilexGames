import { Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import {
  BugMatrixPlayer,
  BugMatrixQuestion,
  BugMatrixRankEntry,
  BugMatrixRoomDTO,
  BugMatrixRoundResult,
  BugMatrixSettings,
  BugMatrixVoteLabel,
  PlayerStatus,
} from '@wiki-race/shared';
import { assertBounds } from '../../common/game-room';
import { BugMatrixRegistryService } from './bug-matrix-registry.service';
import { BugMatrixRulesService } from './bug-matrix-rules.service';
import { BugMatrixPlayerInternal, BugMatrixRoomInternal } from './bug-matrix-room.types';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8;
const VOTE_LABELS: ReadonlySet<BugMatrixVoteLabel> = new Set([
  'NORMAL',
  'FORM',
  'TONE',
  'CONTENT',
]);

const DEFAULT_SETTINGS: BugMatrixSettings = {
  roundCount: 3,
  discussionMs: 180_000,
  questionRotationMs: 30_000,
  voteMs: 60_000,
  targetScore: 10,
};

const SETTINGS_BOUNDS = {
  roundCount: { min: 1, max: 10, code: 'INVALID_ROUND_COUNT' },
  discussionMs: { min: 60_000, max: 600_000, code: 'INVALID_DISCUSSION_MS' },
  questionRotationMs: { min: 15_000, max: 120_000, code: 'INVALID_QUESTION_ROTATION_MS' },
  voteMs: { min: 30_000, max: 180_000, code: 'INVALID_VOTE_MS' },
  targetScore: { min: 5, max: 30, code: 'INVALID_TARGET_SCORE' },
} as const;

@Injectable()
export class BugMatrixService {
  constructor(
    private readonly registry: BugMatrixRegistryService,
    private readonly rules: BugMatrixRulesService,
  ) {}

  // ── Room lifecycle ─────────────────────────────────────────────────────────

  createRoom(
    socketId: string,
    pseudo: string,
    partial: Partial<BugMatrixSettings> = {},
  ): { room: BugMatrixRoomInternal; sessionToken: string } {
    const settings = this.mergeAndValidateSettings(partial);
    const code = this.registry.generateCode();
    const host: BugMatrixPlayerInternal = {
      socketId,
      pseudo,
      score: 0,
      isHost: true,
      status: PlayerStatus.CONNECTED,
      sessionToken: randomUUID(),
    };
    const room = this.registry.createRoom(code, host, settings);
    return { room, sessionToken: host.sessionToken! };
  }

  joinRoom(
    socketId: string,
    roomCode: string,
    pseudo: string,
    sessionToken?: string,
  ): { room: BugMatrixRoomInternal; sessionToken: string; reconnected: boolean } {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const existing = room.players.find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    if (existing) {
      if (existing.sessionToken !== null && sessionToken !== existing.sessionToken) {
        throw new Error('INVALID_SESSION_TOKEN');
      }
      if (existing.sessionToken === null) existing.sessionToken = randomUUID();
      this.registry.rebindSocket(existing.socketId, socketId, roomCode);
      existing.status = PlayerStatus.CONNECTED;
      return { room, sessionToken: existing.sessionToken, reconnected: true };
    }

    if (room.phase !== 'WAITING') throw new Error('GAME_IN_PROGRESS');
    if (room.players.length >= MAX_PLAYERS) throw new Error('ROOM_FULL');
    if (room.players.some((p) => p.pseudo === pseudo)) throw new Error('PSEUDO_TAKEN');

    const player: BugMatrixPlayerInternal = {
      socketId,
      pseudo,
      score: 0,
      isHost: false,
      status: PlayerStatus.CONNECTED,
      sessionToken: randomUUID(),
    };
    this.registry.addPlayer(roomCode, player);
    return { room, sessionToken: player.sessionToken!, reconnected: false };
  }

  leaveRoom(socketId: string): { room: BugMatrixRoomInternal | null; deleted: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) return { room: null, deleted: true };
    this.registry.transferHostIfNeeded(room, socketId);
    this.registry.removePlayer(room.code, socketId);
    if (room.players.length === 0) {
      this.registry.deleteRoom(room.code);
      return { room: null, deleted: true };
    }
    return { room, deleted: false };
  }

  markDisconnected(socketId: string): BugMatrixRoomInternal | null {
    return this.registry.markDisconnected(socketId);
  }

  findReconnectSocketId(roomCode: string, pseudo: string): string | null {
    const room = this.registry.findRoom(roomCode);
    if (!room) return null;
    const existing = room.players.find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    return existing?.socketId ?? null;
  }

  getRoomBySocket(socketId: string): BugMatrixRoomInternal | undefined {
    return this.registry.findRoomBySocketId(socketId);
  }

  getRoomByCode(code: string): BugMatrixRoomInternal | undefined {
    return this.registry.findRoom(code);
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  private mergeAndValidateSettings(partial: Partial<BugMatrixSettings>): BugMatrixSettings {
    const merged: BugMatrixSettings = { ...DEFAULT_SETTINGS, ...partial };
    for (const key of Object.keys(SETTINGS_BOUNDS) as (keyof BugMatrixSettings)[]) {
      const b = SETTINGS_BOUNDS[key];
      assertBounds(merged[key], b.min, b.max, b.code);
    }
    return merged;
  }

  updateSettings(socketId: string, partial: Partial<BugMatrixSettings>): BugMatrixRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player?.isHost) throw new Error('NOT_HOST');
    if (room.phase !== 'WAITING') throw new Error('GAME_IN_PROGRESS');
    room.settings = this.mergeAndValidateSettings({ ...room.settings, ...partial });
    return room;
  }

  // ── Game flow ──────────────────────────────────────────────────────────────

  startGame(socketId: string, partial?: Partial<BugMatrixSettings>): BugMatrixRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    const player = room.players.find((p) => p.socketId === socketId);
    if (!player?.isHost) throw new Error('NOT_HOST');
    if (room.phase !== 'WAITING' && room.phase !== 'FINISHED') {
      throw new Error('GAME_IN_PROGRESS');
    }
    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    if (connected.length < MIN_PLAYERS) throw new Error('NOT_ENOUGH_PLAYERS');

    if (partial) room.settings = this.mergeAndValidateSettings({ ...room.settings, ...partial });

    for (const p of room.players) p.score = 0;
    room.round = 1;
    room.status = 'IN_GAME';
    this.assignRolesAndPickQuestions(room);
    room.phase = 'BRIEF';
    room.lastResult = null;
    room.discussionTimerEndsAt = null;
    room.voteTimerEndsAt = null;
    room.voteMap = {};
    return room;
  }

  /** Pick a Normal at random among CONNECTED players, distribute unique rules to others,
   *  pick a fresh theme and a question pool sized to discussionMs / rotationMs (with margin). */
  private assignRolesAndPickQuestions(room: BugMatrixRoomInternal): void {
    const connected = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    if (connected.length < MIN_PLAYERS) throw new Error('NOT_ENOUGH_PLAYERS');

    // Reset all role/rule fields first so DISCONNECTED players don't leak stale data
    for (const p of room.players) {
      delete p.role;
      delete p.ruleId;
      delete p.ruleLabel;
      delete p.ruleCategory;
    }

    const normalIdx = randomInt(0, connected.length);
    const rulesNeeded = connected.length - 1;
    const rules = this.rules.pickRules(rulesNeeded);
    let ruleCursor = 0;
    for (let i = 0; i < connected.length; i += 1) {
      const p = connected[i];
      if (i === normalIdx) {
        p.role = 'NORMAL';
      } else {
        const rule = rules[ruleCursor++];
        p.role = 'GLITCHED';
        p.ruleId = rule.id;
        p.ruleLabel = rule.label;
        p.ruleCategory = rule.category;
      }
    }

    const theme = this.rules.pickTheme();
    room.themeLabel = theme.label;

    // Generate enough questions to cover the entire discussion phase plus some slack
    const expectedRotations = Math.max(
      1,
      Math.ceil(room.settings.discussionMs / room.settings.questionRotationMs) + 2,
    );
    room.questionPool = this.rules.pickQuestions(expectedRotations);
    room.currentQuestionIndex = 0;
    room.currentQuestion = null;
  }

  /** Used by the gateway on the BRIEF→DISCUSSION transition. */
  enterDiscussion(code: string, now: number): BugMatrixRoomInternal {
    const room = this.registry.findRoom(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'BRIEF') throw new Error('NOT_IN_BRIEF');
    room.phase = 'DISCUSSION';
    room.discussionTimerEndsAt = now + room.settings.discussionMs;
    return room;
  }

  /** Returns the next question and advances the cursor (cycling). */
  rotateQuestion(code: string): BugMatrixQuestion | null {
    const room = this.registry.findRoom(code);
    if (!room) return null;
    if (room.questionPool.length === 0) return null;
    const q = room.questionPool[room.currentQuestionIndex % room.questionPool.length];
    room.currentQuestionIndex += 1;
    room.currentQuestion = q;
    return q;
  }

  /** Used by the gateway on the DISCUSSION→VOTE transition. */
  enterVote(code: string, now: number): BugMatrixRoomInternal {
    const room = this.registry.findRoom(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'DISCUSSION') throw new Error('NOT_IN_DISCUSSION');
    room.phase = 'VOTE';
    room.discussionTimerEndsAt = null;
    room.currentQuestion = null;
    room.voteTimerEndsAt = now + room.settings.voteMs;
    return room;
  }

  submitVote(
    socketId: string,
    votes: Record<string, BugMatrixVoteLabel>,
  ): { room: BugMatrixRoomInternal; allVoted: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'VOTE') throw new Error('NOT_VOTING');
    const voter = room.players.find((p) => p.socketId === socketId);
    if (!voter) throw new Error('PLAYER_NOT_FOUND');
    if (room.voteMap[voter.pseudo]) throw new Error('ALREADY_VOTED');

    if (typeof votes !== 'object' || votes === null) throw new Error('INVALID_VOTE');
    const validatedVotes: Record<string, BugMatrixVoteLabel> = {};
    for (const [target, label] of Object.entries(votes)) {
      if (target === voter.pseudo) throw new Error('INVALID_VOTE');
      const t = room.players.find((p) => p.pseudo === target);
      if (!t) throw new Error('INVALID_VOTE');
      if (!VOTE_LABELS.has(label)) throw new Error('INVALID_VOTE');
      validatedVotes[target] = label;
    }
    room.voteMap[voter.pseudo] = validatedVotes;

    const eligible = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    const allVoted = eligible.every((p) => room.voteMap[p.pseudo]);
    return { room, allVoted };
  }

  /** Resolve a round: compute scoreDeltas, apply to scores, set lastResult and
   *  transition to REVEAL. Returns the result and whether the game is finished. */
  resolveRound(code: string): {
    room: BugMatrixRoomInternal;
    result: BugMatrixRoundResult;
    finished: boolean;
  } {
    const room = this.registry.findRoom(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'VOTE') throw new Error('NOT_VOTING');

    const normal = room.players.find((p) => p.role === 'NORMAL');
    if (!normal) throw new Error('INVALID_STATE');

    const eligible = room.players.filter((p) => p.status === PlayerStatus.CONNECTED);
    const voters = eligible.filter((p) => room.voteMap[p.pseudo]);
    const scoreDeltas: Record<string, number> = {};
    for (const p of room.players) scoreDeltas[p.pseudo] = 0;

    // (1) Glitched: +2 if at least one of their NORMAL votes hit the real Normal
    //     +1 per voter that mistakenly labeled them NORMAL (paraître crédible)
    for (const p of room.players) {
      if (p.role !== 'GLITCHED') continue;

      // (a) +2 if voter found the Normal
      const myVotes = room.voteMap[p.pseudo];
      if (myVotes && myVotes[normal.pseudo] === 'NORMAL') {
        scoreDeltas[p.pseudo] += 2;
      }

      // (b) +1 per voter (other than self) who labeled THIS glitched as NORMAL
      for (const voter of voters) {
        if (voter.pseudo === p.pseudo) continue;
        const v = room.voteMap[voter.pseudo];
        if (v && v[p.pseudo] === 'NORMAL') {
          scoreDeltas[p.pseudo] += 1;
        }
      }
    }

    // (2) Normal: +3 if STRICTLY less than half of the OTHER eligible players labeled them NORMAL
    const accusers = voters.filter((v) => {
      const vm = room.voteMap[v.pseudo];
      return v.pseudo !== normal.pseudo && vm?.[normal.pseudo] === 'NORMAL';
    }).length;
    const otherEligible = eligible.filter((p) => p.pseudo !== normal.pseudo).length;
    if (otherEligible > 0 && accusers * 2 < otherEligible) {
      scoreDeltas[normal.pseudo] += 3;
    }

    // (3) Category bonus: each voter +1 per glitched target whose ruleCategory was guessed
    for (const voter of voters) {
      const v = room.voteMap[voter.pseudo];
      if (!v) continue;
      for (const [target, label] of Object.entries(v)) {
        if (label === 'NORMAL') continue;
        const t = room.players.find((pp) => pp.pseudo === target);
        if (t?.role === 'GLITCHED' && t.ruleCategory === label) {
          scoreDeltas[voter.pseudo] += 1;
        }
      }
    }

    // Apply deltas
    for (const p of room.players) p.score += scoreDeltas[p.pseudo] ?? 0;

    const result: BugMatrixRoundResult = {
      round: room.round,
      normalPseudo: normal.pseudo,
      votes: this.cloneVoteMap(room.voteMap),
      rules: room.players
        .filter((p) => p.role === 'GLITCHED' && p.ruleLabel && p.ruleCategory)
        .map((p) => ({
          pseudo: p.pseudo,
          ruleLabel: p.ruleLabel!,
          category: p.ruleCategory!,
        })),
      scoreDeltas,
    };

    room.phase = 'REVEAL';
    room.voteTimerEndsAt = null;
    room.lastResult = result;

    const reachedTarget = room.players.some((p) => p.score >= room.settings.targetScore);
    const reachedRoundCount = room.round >= room.settings.roundCount;
    const finished = reachedTarget || reachedRoundCount;
    if (finished) {
      room.phase = 'FINISHED';
      room.status = 'FINISHED';
    }

    return { room, result, finished };
  }

  /** Prepare the next round: new normal, new rules, new theme, new pool. Reuses startGame's
   *  role-assignment logic; bumps round counter and resets phase to BRIEF. */
  nextRound(code: string): BugMatrixRoomInternal {
    const room = this.registry.findRoom(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.phase !== 'REVEAL') throw new Error('NOT_AT_REVEAL');
    room.round += 1;
    room.voteMap = {};
    room.lastResult = null;
    room.discussionTimerEndsAt = null;
    room.voteTimerEndsAt = null;
    this.assignRolesAndPickQuestions(room);
    room.phase = 'BRIEF';
    return room;
  }

  resetRoom(socketId: string): BugMatrixRoomInternal {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    const caller = room.players.find((p) => p.socketId === socketId);
    if (!caller?.isHost) throw new Error('NOT_HOST');
    room.status = 'WAITING';
    room.phase = 'WAITING';
    room.round = 0;
    room.themeLabel = null;
    room.currentQuestion = null;
    room.discussionTimerEndsAt = null;
    room.voteTimerEndsAt = null;
    room.voteMap = {};
    room.questionPool = [];
    room.currentQuestionIndex = 0;
    room.lastResult = null;
    for (const p of room.players) {
      p.score = 0;
      delete p.role;
      delete p.ruleId;
      delete p.ruleLabel;
      delete p.ruleCategory;
    }
    return room;
  }

  // ── DTO + helpers ──────────────────────────────────────────────────────────

  rankPlayers(room: BugMatrixRoomInternal): BugMatrixRankEntry[] {
    const sorted = [...room.players].sort((a, b) => b.score - a.score);
    return sorted.map((p, i) => ({ pseudo: p.pseudo, score: p.score, rank: i + 1 }));
  }

  /** Strip server-only fields and hide secrets outside REVEAL/FINISHED. */
  toDTO(room: BugMatrixRoomInternal): BugMatrixRoomDTO {
    const exposeRoles = room.phase === 'REVEAL' || room.phase === 'FINISHED';
    const players: BugMatrixPlayer[] = room.players.map((p) => {
      const base: BugMatrixPlayer = {
        socketId: p.socketId,
        pseudo: p.pseudo,
        score: p.score,
        isHost: p.isHost,
        status: p.status,
      };
      if (exposeRoles && p.role) {
        base.role = p.role;
        if (p.ruleLabel) base.ruleLabel = p.ruleLabel;
        if (p.ruleCategory) base.ruleCategory = p.ruleCategory;
      }
      return base;
    });
    return {
      code: room.code,
      status: room.status,
      phase: room.phase,
      round: room.round,
      themeLabel: room.themeLabel,
      players,
      settings: room.settings,
      hostPseudo: room.hostPseudo,
      currentQuestion: room.currentQuestion,
      discussionTimerEndsAt: room.discussionTimerEndsAt,
      voteTimerEndsAt: room.voteTimerEndsAt,
      lastResult: exposeRoles ? room.lastResult : null,
    };
  }

  /** Build a deep copy so consumers can serialize without leaking the live ref. */
  private cloneVoteMap(voteMap: BugMatrixRoomInternal['voteMap']): BugMatrixRoomInternal['voteMap'] {
    const out: BugMatrixRoomInternal['voteMap'] = {};
    for (const [voter, votes] of Object.entries(voteMap)) {
      out[voter] = { ...votes };
    }
    return out;
  }
}
