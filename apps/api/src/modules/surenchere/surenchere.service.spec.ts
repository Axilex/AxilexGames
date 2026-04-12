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
    const room = service.createRoom('s1', 'Alice');
    expect(room.code).toHaveLength(6);
    expect(room.phase).toBe('WAITING');
    expect(room.players).toHaveLength(1);
    expect(room.players[0].isHost).toBe(true);
    expect(room.settings.totalRounds).toBe(5);
  });

  it('joinRoom adds a second player', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    expect(room.players).toHaveLength(2);
  });

  it('joinRoom rejects unknown room', async () => {
    const { service } = await setup();
    expect(() => service.joinRoom('s2', 'XXXXXX', 'Bob')).toThrow('ROOM_NOT_FOUND');
  });

  it('joinRoom rejects duplicate pseudo', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    expect(() => service.joinRoom('s2', room.code, 'Alice')).toThrow('PSEUDO_TAKEN');
  });

  it('startGame refuses non-host', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
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
    const room = service.createRoom('s1', 'Alice');
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
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    expect(() =>
      service.chooseChallenge('s2', { challengeId: started.challengeOptions[0].id }),
    ).toThrow('NOT_CHOOSER');
  });

  it('chooseChallenge fixes the challenge and moves to BIDDING', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
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
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    const after = service.chooseChallenge('s1', { customPhrase: 'Citer des animaux marins' });
    expect(after.phase).toBe('BIDDING');
    expect(after.currentChallenge?.source).toBe('custom');
    expect(after.currentChallenge?.prompt).toBe('Citer des animaux marins');
    expect(after.currentChallenge?.letter).toBeTruthy();
  });

  it('chooseChallenge rejects custom phrase shorter than 5 chars', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    expect(() => service.chooseChallenge('s1', { customPhrase: 'abc' })).toThrow(
      'CUSTOM_PHRASE_TOO_SHORT',
    );
  });

  it('chooseChallenge rejects custom phrase longer than 200 chars', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    expect(() =>
      service.chooseChallenge('s1', { customPhrase: 'a'.repeat(201) }),
    ).toThrow('CUSTOM_PHRASE_TOO_LONG');
  });

  it('chooseChallenge rejects when neither challengeId nor customPhrase provided', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.startGame('s1');
    expect(() => service.chooseChallenge('s1', {})).toThrow('MISSING_CHALLENGE_OPTION');
  });

  it('placeBid refuses amount ≤ currentBid', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 5);
    expect(() => service.placeBid('s2', 5)).toThrow('BID_TOO_LOW');
  });

  it('placeBid refuses self bid', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 5);
    expect(() => service.placeBid('s1', 6)).toThrow('CANNOT_BID_ON_SELF');
  });

  it('pass detects allPassed and sets phase WORDS with wasForced=true', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
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
    const room = service.createRoom('s1', 'Alice');
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
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 3);
    service.triggerChallenge('s1');
    expect(() => service.submitWords('s2', ['a', 'b', 'c'])).toThrow('NOT_CURRENT_BIDDER');
  });

  it('submitWords rejects if words.length < currentBid', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 4);
    service.triggerChallenge('s1');
    expect(() => service.submitWords('s1', ['a', 'b'])).toThrow('NOT_ENOUGH_WORDS');
  });

  it('submitWords cleans words and moves to VERDICT', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 2);
    service.triggerChallenge('s1');
    const after = service.submitWords('s1', [' foo ', '', 'bar', '  ']);
    expect(after.phase).toBe('VERDICT');
    expect(after.currentWords).toEqual(['foo', 'bar']);
  });

  it('resolveVerdict success non-forced → score += bid', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 7);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    const { room: r, result } = service.resolveVerdict('s1', true);
    expect(r.players.find((p) => p.socketId === 's1')!.score).toBe(7);
    expect(result.forcedBonus).toBe(0);
    expect(result.words).toHaveLength(7);
  });

  it('resolveVerdict success forced → score += bid + passCount bonus', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.joinRoom('s3', room.code, 'Carol');
    service.joinRoom('s4', room.code, 'Dave');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 5);
    service.pass('s2');
    service.pass('s3');
    service.pass('s4');
    // now room.phase === WORDS, wasForced=true, 3 passes
    service.submitWords('s1', ['a', 'b', 'c', 'd', 'e']);
    const { room: r, result } = service.resolveVerdict('s1', true);
    expect(result.forcedBonus).toBe(3);
    expect(r.players.find((p) => p.socketId === 's1')!.score).toBe(8);
  });

  it('resolveVerdict failure forced → no negative bonus (delta = -bid)', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    service.joinRoom('s3', room.code, 'Carol');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s2', 6);
    service.pass('s1');
    service.pass('s3');
    service.submitWords('s2', ['a', 'b', 'c', 'd', 'e', 'f']);
    const { room: r, result } = service.resolveVerdict('s1', false);
    expect(result.forcedBonus).toBe(0);
    expect(r.players.find((p) => p.socketId === 's2')!.score).toBe(-6);
  });

  it('resolveVerdict failure → score -= bid (negative allowed)', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s2', 10);
    service.triggerChallenge('s2');
    service.submitWords('s2', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
    const { room: r } = service.resolveVerdict('s1', false);
    expect(r.players.find((p) => p.socketId === 's2')!.score).toBe(-10);
  });

  it('game finishes after totalRounds', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice', { totalRounds: 1 });
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 3);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['a', 'b', 'c']);
    const res = service.resolveVerdict('s1', true);
    expect(res.finished).toBe(true);
    expect(res.room.phase).toBe('FINISHED');
  });

  it('resetRoom refuses non-host and clears scores', async () => {
    const { service } = await setup();
    const room = service.createRoom('s1', 'Alice');
    service.joinRoom('s2', room.code, 'Bob');
    const started = service.startGame('s1');
    pickFirstChallenge(service, started, 's1');
    service.placeBid('s1', 4);
    service.triggerChallenge('s1');
    service.submitWords('s1', ['a', 'b', 'c', 'd']);
    service.resolveVerdict('s1', true);
    expect(() => service.resetRoom('s2')).toThrow('NOT_HOST');
    const r = service.resetRoom('s1');
    expect(r.phase).toBe('WAITING');
    expect(r.players.every((p) => p.score === 0)).toBe(true);
    expect(r.challengeOptions).toHaveLength(0);
    expect(r.wasForced).toBe(false);
  });
});
