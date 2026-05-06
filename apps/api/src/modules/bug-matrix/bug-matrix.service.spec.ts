import { Test, TestingModule } from '@nestjs/testing';
import { BugMatrixVoteLabel } from '@wiki-race/shared';
import { BugMatrixService } from './bug-matrix.service';
import { BugMatrixRegistryService } from './bug-matrix-registry.service';
import { BugMatrixRulesService } from './bug-matrix-rules.service';
import { BugMatrixRoomInternal } from './bug-matrix-room.types';

async function setup() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [BugMatrixService, BugMatrixRegistryService, BugMatrixRulesService],
  }).compile();
  return { service: module.get<BugMatrixService>(BugMatrixService) };
}

function seedThreePlayerGame(service: BugMatrixService): {
  room: BugMatrixRoomInternal;
} {
  const { room } = service.createRoom('s1', 'Alice');
  service.joinRoom('s2', room.code, 'Bob');
  service.joinRoom('s3', room.code, 'Carol');
  service.startGame('s1');
  return { room };
}

describe('BugMatrixService', () => {
  describe('room lifecycle', () => {
    it('creates a room with a 6-char code, host, WAITING phase, default settings', async () => {
      const { service } = await setup();
      const { room, sessionToken } = service.createRoom('s1', 'Alice');
      expect(room.code).toHaveLength(6);
      expect(room.phase).toBe('WAITING');
      expect(room.status).toBe('WAITING');
      expect(room.players).toHaveLength(1);
      expect(room.players[0].isHost).toBe(true);
      expect(room.hostPseudo).toBe('Alice');
      expect(room.settings.roundCount).toBe(3);
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken).toHaveLength(36); // UUID
    });

    it('rejects invalid settings on create', async () => {
      const { service } = await setup();
      expect(() =>
        service.createRoom('s1', 'Alice', { roundCount: 99 }),
      ).toThrow('INVALID_ROUND_COUNT');
      expect(() =>
        service.createRoom('s1', 'Alice', { discussionMs: 1000 }),
      ).toThrow('INVALID_DISCUSSION_MS');
    });

    it('joinRoom adds a second player', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice');
      service.joinRoom('s2', room.code, 'Bob');
      expect(room.players).toHaveLength(2);
    });

    it('joinRoom rejects unknown room', async () => {
      const { service } = await setup();
      expect(() => service.joinRoom('s2', 'XXXXXX', 'Bob')).toThrow('ROOM_NOT_FOUND');
    });

    it('joinRoom rejects duplicate pseudo', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice');
      expect(() => service.joinRoom('s2', room.code, 'Alice')).toThrow('PSEUDO_TAKEN');
    });

    it('joinRoom rejects new player after game started', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      expect(() => service.joinRoom('s4', room.code, 'Dave')).toThrow('GAME_IN_PROGRESS');
    });

    it('joinRoom reconnects DISCONNECTED with valid token', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice');
      const { sessionToken } = service.joinRoom('s2', room.code, 'Bob');
      service.markDisconnected('s2');
      const { reconnected } = service.joinRoom('s2-new', room.code, 'Bob', sessionToken);
      expect(reconnected).toBe(true);
      expect(room.players.find((p) => p.pseudo === 'Bob')?.socketId).toBe('s2-new');
    });

    it('joinRoom rejects invalid sessionToken on reconnect', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice');
      service.joinRoom('s2', room.code, 'Bob');
      service.markDisconnected('s2');
      expect(() => service.joinRoom('s2-new', room.code, 'Bob', 'wrong')).toThrow(
        'INVALID_SESSION_TOKEN',
      );
    });
  });

  describe('startGame', () => {
    it('refuses non-host', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice');
      service.joinRoom('s2', room.code, 'Bob');
      service.joinRoom('s3', room.code, 'Carol');
      expect(() => service.startGame('s2')).toThrow('NOT_HOST');
    });

    it('refuses with fewer than 3 connected players', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice');
      service.joinRoom('s2', room.code, 'Bob');
      expect(() => service.startGame('s1')).toThrow('NOT_ENOUGH_PLAYERS');
    });

    it('assigns exactly one Normal and unique rules to others', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      const normals = room.players.filter((p) => p.role === 'NORMAL');
      const glitched = room.players.filter((p) => p.role === 'GLITCHED');
      expect(normals).toHaveLength(1);
      expect(glitched).toHaveLength(2);
      const ruleIds = glitched.map((p) => p.ruleId);
      expect(new Set(ruleIds).size).toBe(2);
      for (const g of glitched) {
        expect(g.ruleLabel).toBeDefined();
        expect(g.ruleCategory).toBeDefined();
      }
    });

    it('generates a question pool sized for the discussion phase plus margin', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      // default: discussionMs=180000, questionRotationMs=30000 => 6 ticks +2 margin = 8
      expect(room.questionPool.length).toBeGreaterThanOrEqual(8);
    });

    it('puts the game in BRIEF phase with status IN_GAME', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      expect(room.phase).toBe('BRIEF');
      expect(room.status).toBe('IN_GAME');
      expect(room.themeLabel).toBeTruthy();
    });
  });

  describe('rotateQuestion', () => {
    it('cycles through the question pool', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      const ids = new Set<string>();
      for (let i = 0; i < room.questionPool.length; i += 1) {
        const q = service.rotateQuestion(room.code);
        expect(q).toBeTruthy();
        ids.add(q!.id);
      }
      expect(ids.size).toBe(room.questionPool.length);
    });
  });

  describe('submitVote', () => {
    function intoVotePhase(service: BugMatrixService) {
      const { room } = seedThreePlayerGame(service);
      service.enterDiscussion(room.code, 0);
      service.enterVote(room.code, 0);
      return room;
    }

    it('refuses outside VOTE phase', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      expect(() => service.submitVote('s1', { Bob: 'NORMAL', Carol: 'FORM' })).toThrow(
        'NOT_VOTING',
      );
      expect(room.phase).toBe('BRIEF');
    });

    it('rejects unknown target pseudo', async () => {
      const { service } = await setup();
      intoVotePhase(service);
      expect(() => service.submitVote('s1', { Eve: 'NORMAL', Carol: 'FORM' })).toThrow(
        'INVALID_VOTE',
      );
    });

    it('rejects voting on self', async () => {
      const { service } = await setup();
      intoVotePhase(service);
      expect(() => service.submitVote('s1', { Alice: 'NORMAL', Bob: 'FORM' })).toThrow(
        'INVALID_VOTE',
      );
    });

    it('rejects unknown label', async () => {
      const { service } = await setup();
      intoVotePhase(service);
      expect(() =>
        service.submitVote('s1', { Bob: 'NOPE' as BugMatrixVoteLabel, Carol: 'FORM' }),
      ).toThrow('INVALID_VOTE');
    });

    it('detects allVoted when every connected player has voted', async () => {
      const { service } = await setup();
      const room = intoVotePhase(service);
      const v1 = service.submitVote('s1', { Bob: 'NORMAL', Carol: 'FORM' });
      expect(v1.allVoted).toBe(false);
      const v2 = service.submitVote('s2', { Alice: 'NORMAL', Carol: 'FORM' });
      expect(v2.allVoted).toBe(false);
      const v3 = service.submitVote('s3', { Alice: 'NORMAL', Bob: 'FORM' });
      expect(v3.allVoted).toBe(true);
      expect(Object.keys(room.voteMap)).toHaveLength(3);
    });
  });

  describe('resolveRound scoring', () => {
    /** Build a deterministic 3-player room where we control role assignment. */
    function fixedRoles(
      service: BugMatrixService,
      normalPseudo: 'Alice' | 'Bob' | 'Carol',
    ): BugMatrixRoomInternal {
      const { room } = seedThreePlayerGame(service);
      // Override roles deterministically for the assertion
      for (const p of room.players) {
        if (p.pseudo === normalPseudo) {
          p.role = 'NORMAL';
          delete p.ruleId;
          delete p.ruleLabel;
          delete p.ruleCategory;
        } else {
          p.role = 'GLITCHED';
          // assign deterministic categories — Bob:FORM, Carol:TONE
          p.ruleId = `test-${p.pseudo}`;
          p.ruleLabel = `rule for ${p.pseudo}`;
          p.ruleCategory = p.pseudo === 'Bob' ? 'FORM' : 'TONE';
        }
      }
      service.enterDiscussion(room.code, 0);
      service.enterVote(room.code, 0);
      return room;
    }

    it('Glitched gets +2 when finding the Normal', async () => {
      const { service } = await setup();
      const room = fixedRoles(service, 'Alice');
      service.submitVote('s2', { Alice: 'NORMAL', Carol: 'FORM' });
      service.submitVote('s3', { Alice: 'NORMAL', Bob: 'FORM' });
      service.submitVote('s1', { Bob: 'FORM', Carol: 'TONE' }); // Normal can vote too
      const { result } = service.resolveRound(room.code);
      expect(result.scoreDeltas.Bob).toBeGreaterThanOrEqual(2);
      expect(result.scoreDeltas.Carol).toBeGreaterThanOrEqual(2);
    });

    it('Normal gets +3 when strictly less than half label them NORMAL', async () => {
      const { service } = await setup();
      const room = fixedRoles(service, 'Alice');
      // Both glitched accuse Carol (wrong)
      service.submitVote('s2', { Alice: 'FORM', Carol: 'NORMAL' });
      service.submitVote('s3', { Alice: 'FORM', Bob: 'NORMAL' });
      service.submitVote('s1', { Bob: 'FORM', Carol: 'TONE' });
      const { result } = service.resolveRound(room.code);
      expect(result.scoreDeltas.Alice).toBeGreaterThanOrEqual(3);
    });

    it('Normal does not get +3 when at least half identify them', async () => {
      const { service } = await setup();
      const room = fixedRoles(service, 'Alice');
      // Both glitched correctly identify Alice as NORMAL
      service.submitVote('s2', { Alice: 'NORMAL', Carol: 'FORM' });
      service.submitVote('s3', { Alice: 'NORMAL', Bob: 'FORM' });
      // Alice votes wrong categories on purpose to isolate the Normal-bonus check
      service.submitVote('s1', { Bob: 'CONTENT', Carol: 'CONTENT' });
      const { result } = service.resolveRound(room.code);
      // 2/2 other-eligible accusers => not <50% => Alice gets no bonus from being Normal
      expect(result.scoreDeltas.Alice).toBe(0);
    });

    it('Category bonus: +1 per correctly guessed glitched ruleCategory', async () => {
      const { service } = await setup();
      const room = fixedRoles(service, 'Alice');
      // Alice correctly guesses both categories: Bob=FORM (correct), Carol=TONE (correct)
      service.submitVote('s1', { Bob: 'FORM', Carol: 'TONE' });
      service.submitVote('s2', { Alice: 'NORMAL', Carol: 'CONTENT' }); // wrong category
      service.submitVote('s3', { Alice: 'NORMAL', Bob: 'CONTENT' }); // wrong category
      const { result } = service.resolveRound(room.code);
      expect(result.scoreDeltas.Alice).toBeGreaterThanOrEqual(2); // +2 from categories at least
    });

    it('transitions to FINISHED when targetScore is reached', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice', { targetScore: 5 });
      service.joinRoom('s2', room.code, 'Bob');
      service.joinRoom('s3', room.code, 'Carol');
      service.startGame('s1');
      // Manually nudge a score above target
      room.players[0].score = 6;
      service.enterDiscussion(room.code, 0);
      service.enterVote(room.code, 0);
      service.submitVote('s1', { Bob: 'FORM', Carol: 'TONE' });
      service.submitVote('s2', { Alice: 'NORMAL', Carol: 'FORM' });
      service.submitVote('s3', { Alice: 'NORMAL', Bob: 'FORM' });
      const { finished } = service.resolveRound(room.code);
      expect(finished).toBe(true);
      expect(room.phase).toBe('FINISHED');
    });

    it('transitions to FINISHED when roundCount is reached', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice', { roundCount: 1, targetScore: 30 });
      service.joinRoom('s2', room.code, 'Bob');
      service.joinRoom('s3', room.code, 'Carol');
      service.startGame('s1');
      service.enterDiscussion(room.code, 0);
      service.enterVote(room.code, 0);
      service.submitVote('s1', { Bob: 'FORM', Carol: 'TONE' });
      service.submitVote('s2', { Alice: 'NORMAL', Carol: 'FORM' });
      service.submitVote('s3', { Alice: 'NORMAL', Bob: 'FORM' });
      const { finished } = service.resolveRound(room.code);
      expect(finished).toBe(true);
    });
  });

  describe('toDTO', () => {
    it('hides role/ruleLabel outside REVEAL/FINISHED', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      const dto = service.toDTO(room);
      for (const p of dto.players) {
        expect(p.role).toBeUndefined();
        expect(p.ruleLabel).toBeUndefined();
        expect(p.ruleCategory).toBeUndefined();
      }
      expect(dto.lastResult).toBeNull();
    });

    it('exposes role/rule in REVEAL', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      service.enterDiscussion(room.code, 0);
      service.enterVote(room.code, 0);
      service.submitVote('s1', { Bob: 'FORM', Carol: 'TONE' });
      service.submitVote('s2', { Alice: 'NORMAL', Carol: 'FORM' });
      service.submitVote('s3', { Alice: 'NORMAL', Bob: 'FORM' });
      service.resolveRound(room.code);
      const dto = service.toDTO(room);
      const glitched = dto.players.filter((p) => p.role === 'GLITCHED');
      expect(glitched.length).toBeGreaterThan(0);
      for (const g of glitched) expect(g.ruleLabel).toBeTruthy();
      expect(dto.lastResult).not.toBeNull();
    });

    it('never includes sessionToken', async () => {
      const { service } = await setup();
      const { room } = service.createRoom('s1', 'Alice');
      const dto = service.toDTO(room);
      for (const p of dto.players) {
        expect((p as unknown as Record<string, unknown>).sessionToken).toBeUndefined();
      }
    });
  });

  describe('reset', () => {
    it('returns to WAITING with cleared scores', async () => {
      const { service } = await setup();
      const { room } = seedThreePlayerGame(service);
      room.players[0].score = 5;
      const updated = service.resetRoom('s1');
      expect(updated.phase).toBe('WAITING');
      expect(updated.status).toBe('WAITING');
      for (const p of updated.players) {
        expect(p.score).toBe(0);
        expect(p.role).toBeUndefined();
      }
    });

    it('refuses non-host', async () => {
      const { service } = await setup();
      seedThreePlayerGame(service);
      expect(() => service.resetRoom('s2')).toThrow('NOT_HOST');
    });
  });
});
