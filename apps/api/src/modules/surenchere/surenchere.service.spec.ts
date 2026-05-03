import { Test, TestingModule } from '@nestjs/testing';
import { SurenchereService } from './surenchere.service';
import { SurenchereRegistryService } from './surenchere-registry.service';
import { SurenchereRoom } from '@wiki-race/shared';

async function setup() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [SurenchereService, SurenchereRegistryService],
  }).compile();
  return { service: module.get<SurenchereService>(SurenchereService) };
}

function pickFirstChallenge(service: SurenchereService, room: SurenchereRoom, socketId: string) {
  const opt = room.challengeOptions[0];
  return service.chooseChallenge(socketId, { challengeId: opt.id });
}

describe('SurenchereService', () => {
  it('creates a room with host and WAITING phase', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    expect(room.code).toHaveLength(6);
    expect(room.phase).toBe('WAITING');
    expect(room.players).toHaveLength(1);
    expect(room.players[0].isHost).toBe(true);
    expect(room.settings.totalRounds).toBe(3);
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

  it('startGame refuses non-host', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    expect(() => service.startGame('s2')).toThrow('NOT_HOST');
  });

  it('startGame refuses with fewer than 2 players', async () => {
    const { service } = await setup();
    service.createRoom('s1', 'Alice');
    expect(() => service.startGame('s1')).toThrow('NOT_ENOUGH_PLAYERS');
  });

  it('startGame transitions to CHOOSING_CHALLENGE with 3 options', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    expect(started.phase).toBe('CHOOSING_CHALLENGE');
    expect(started.challengeOptions).toHaveLength(3);
    expect(started.currentChallenge).toBeNull();
    expect(started.challengeChooserSocketId).toBe('s1');
    expect(started.currentRound).toBe(1);
  });

  it('chooseChallenge rejects non-chooser', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    expect(() =>
      service.chooseChallenge('s2', { challengeId: started.challengeOptions[0].id }),
    ).toThrow('NOT_CHOOSER');
  });

  it('chooseChallenge fixes the challenge and moves to BIDDING', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    const picked = started.challengeOptions[1];
    const after = service.chooseChallenge('s1', { challengeId: picked.id });
    expect(after.phase).toBe('BIDDING');
    expect(after.currentChallenge?.id).toBe(picked.id);
    expect(after.challengeOptions).toHaveLength(0);
  });

  it('chooseChallenge accepts a valid custom phrase', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    const after = service.chooseChallenge('s1', { customPhrase: 'Citer des animaux marins' });
    expect(after.phase).toBe('BIDDING');
    expect(after.currentChallenge?.source).toBe('custom');
    expect(after.currentChallenge?.prompt).toBe('Citer des animaux marins');
  });

  it('chooseChallenge rejects custom phrase shorter than 5 chars', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    expect(() => service.chooseChallenge('s1', { customPhrase: 'abc' })).toThrow(
      'CUSTOM_PHRASE_TOO_SHORT',
    );
  });

  it('chooseChallenge rejects custom phrase longer than 200 chars', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    expect(() => service.chooseChallenge('s1', { customPhrase: 'a'.repeat(201) })).toThrow(
      'CUSTOM_PHRASE_TOO_LONG',
    );
  });

  it('chooseChallenge rejects when neither challengeId nor customPhrase provided', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    expect(() => service.chooseChallenge('s1', {})).toThrow('MISSING_CHALLENGE_OPTION');
  });

  it('placeBid refuses amount ≤ currentBid', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 5);
    expect(() => service.placeBid('s2', 5)).toThrow('BID_TOO_LOW');
  });

  it('placeBid refuses self bid', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 5);
    expect(() => service.placeBid('s1', 6)).toThrow('CANNOT_BID_ON_SELF');
  });

  it('pass detects allPassed and sets phase WORDS with wasForced=true', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.joinRoom('s3', room.code, 'Carol');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 5);
    const r1 = service.pass('s2');
    expect(r1.allPassed).toBe(false);
    const r2 = service.pass('s3');
    expect(r2.allPassed).toBe(true);
    expect(r2.room.phase).toBe('WORDS');
    expect(r2.room.wasForced).toBe(true);
  });

  it('triggerChallenge moves to WORDS with wasForced=false', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 4);
    const after = service.triggerChallenge('s1');
    expect(after.phase).toBe('WORDS');
    expect(after.wasForced).toBe(false);
  });

  it('submitWords rejects non-bidder', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 3);
    service.triggerChallenge('s1');
    expect(() => service.submitWords('s2', ['a', 'b', 'c'])).toThrow('NOT_CURRENT_BIDDER');
  });

  it('submitWords rejects if words.length < currentBid', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 4);
    service.triggerChallenge('s1');
    expect(() => service.submitWords('s1', ['a', 'b'])).toThrow('NOT_ENOUGH_WORDS');
  });

  it('submitWords cleans words and moves to VOTING', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 2);
    service.triggerChallenge('s1');
    const after = service.submitWords('s1', [' foo ', '', 'bar', '  ']);
    expect(after.phase).toBe('VOTING');
    expect(after.currentWords).toEqual(['foo', 'bar']);
    expect(after.voteMap).toEqual({});
  });

  it('vote rejects the bidder voting on their own words', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 1);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['apple']);
    expect(() => service.vote('s1', true)).toThrow('BIDDER_CANNOT_VOTE');
  });

  it('vote rejects double vote', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.joinRoom('s3', room.code, 'Carol'); // 2 voters so first vote doesn't resolve
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 1);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['apple']);
    service.vote('s2', true); // doesn't resolve yet (s3 hasn't voted)
    expect(() => service.vote('s2', false)).toThrow('ALREADY_VOTED');
  });

  it('vote resolves when all voters have voted (block accept → success)', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 2);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['apple', 'banana']);
    // s2 is the only voter — one block vote resolves everything
    const r = service.vote('s2', true);
    expect(r.resolved).toBe(true);
    expect(r.result?.success).toBe(true);
    expect(r.result?.wordVerdicts).toEqual([true, true]);
    // scoreDelta = bid = 2 (no forced)
    expect(r.result?.scoreDelta).toBe(2);
    expect(r.room.players.find((p) => p.socketId === 's1')!.score).toBe(2);
    expect(r.room.phase).toBe('ROUND_END');
  });

  it('vote resolves as failure when majority rejects (block reject)', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.joinRoom('s3', room.code, 'Carol');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 2);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['apple', 'banana']);
    // Both voters reject
    service.vote('s2', false);
    const { resolved, result } = service.vote('s3', false);
    expect(resolved).toBe(true);
    expect(result?.success).toBe(false);
    expect(result?.wordVerdicts).toEqual([false, false]);
    // missingCount = bid = 2 (total failure) → scoreDelta = 0
    expect(result?.scoreDelta).toBe(0);
    expect(result?.missingCount).toBe(2);
  });

  it('vote success forced → scoreDelta = bid + 1 (forced bonus)', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.joinRoom('s3', room.code, 'Carol');
    service.joinRoom('s4', room.code, 'Dave');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 1);
    service.pass('s2');
    service.pass('s3');
    service.pass('s4');
    // wasForced=true (3 opponents passed)
    service.submitWords('s1', ['apple']);
    // s2, s3, s4 all accept the block
    service.vote('s2', true);
    service.vote('s3', true);
    const { resolved, result } = service.vote('s4', true);
    expect(resolved).toBe(true);
    expect(result?.wasForced).toBe(true);
    expect(result?.success).toBe(true);
    // scoreDelta = bid + forced bonus = 1 + 1 = 2
    expect(result?.scoreDelta).toBe(2);
    expect(room.players.find((p) => p.socketId === 's1')!.score).toBe(2);
  });

  it('vote tie (50% accept) resolves as rejected', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.joinRoom('s3', room.code, 'Carol');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 1);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['apple']);
    // 1 accept, 1 reject among 2 voters → tie → rejected
    service.vote('s2', true);
    const { resolved, result } = service.vote('s3', false);
    expect(resolved).toBe(true);
    expect(result?.success).toBe(false);
    expect(result?.wordVerdicts).toEqual([false]);
    expect(result?.scoreDelta).toBe(0);
  });

  it('game finishes after totalRounds', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice', { totalRounds: 1 });
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 1);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['apple']);
    const { resolved, finished } = service.vote('s2', true);
    expect(resolved).toBe(true);
    expect(finished).toBe(true);
    expect(room.phase).toBe('FINISHED');
  });

  it('resetRoom refuses non-host and clears scores', async () => {
    const { service } = await setup();
    const { room } = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 1);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['apple']);
    service.vote('s2', true); // resolve
    expect(() => service.resetRoom('s2')).toThrow('NOT_HOST');
    const r = service.resetRoom('s1');
    expect(r.phase).toBe('WAITING');
    expect(r.players.every((p) => p.score === 0)).toBe(true);
    expect(r.challengeOptions).toHaveLength(0);
    expect(r.wasForced).toBe(false);
    expect(r.voteMap).toEqual({});
  });
});
