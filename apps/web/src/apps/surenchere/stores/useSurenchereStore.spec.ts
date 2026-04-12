import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSurenchereStore } from './useSurenchereStore';
import { PlayerStatus, type SurenchereRoomDTO, type SurenchereRoundResult } from '@wiki-race/shared';

function makeRoom(overrides: Partial<SurenchereRoomDTO> = {}): SurenchereRoomDTO {
  return {
    code: 'ABCDEF',
    phase: 'BIDDING',
    players: [
      { socketId: 's1', pseudo: 'Alice', score: 0, isHost: true, status: PlayerStatus.CONNECTED },
      { socketId: 's2', pseudo: 'Bob', score: 0, isHost: false, status: PlayerStatus.CONNECTED },
      { socketId: 's3', pseudo: 'Carol', score: 0, isHost: false, status: PlayerStatus.CONNECTED },
    ],
    settings: { totalRounds: 5, startBid: 5 },
    currentRound: 1,
    currentChallenge: { id: 'c1', category: 'Test', prompt: 'p', letter: 'A', source: 'predefined' },
    challengeOptions: [],
    challengeChooserSocketId: null,
    currentBid: 0,
    currentBidderSocketId: null,
    passedSocketIds: [],
    currentWords: null,
    wasForced: false,
    roundStarterIndex: 0,
    lastRoundResult: null,
    ...overrides,
  };
}

describe('useSurenchereStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('canBid true when I am not the current bidder and have not passed', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s2');
    store.setRoom(
      makeRoom({ currentBidderSocketId: 's1', currentBid: 5, passedSocketIds: [] }),
    );
    expect(store.canBid).toBe(true);
  });

  it('canBid false when I am the current bidder', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s1');
    store.setRoom(makeRoom({ currentBidderSocketId: 's1', currentBid: 5 }));
    expect(store.canBid).toBe(false);
  });

  it('allPassed true when all non-bidders have passed', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s1');
    store.setRoom(
      makeRoom({ currentBidderSocketId: 's1', currentBid: 5, passedSocketIds: ['s2', 's3'] }),
    );
    expect(store.allPassed).toBe(true);
  });

  it('canChallenge true for current bidder when everyone else passed', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s1');
    store.setRoom(
      makeRoom({ currentBidderSocketId: 's1', currentBid: 5, passedSocketIds: ['s2', 's3'] }),
    );
    expect(store.canChallenge).toBe(true);
  });

  it('addPass appends socketId and allPassed flips when complete', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s1');
    store.setRoom(
      makeRoom({ currentBidderSocketId: 's1', currentBid: 5, passedSocketIds: [] }),
    );
    store.addPass('s2');
    expect(store.allPassed).toBe(false);
    store.addPass('s3');
    expect(store.allPassed).toBe(true);
  });

  it('isChallengeChooser true when I am chooser and phase CHOOSING_CHALLENGE', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s1');
    store.setRoom(
      makeRoom({
        phase: 'CHOOSING_CHALLENGE',
        challengeChooserSocketId: 's1',
        challengeOptions: [
          { id: 'a', category: 'X', prompt: 'p', letter: 'A', source: 'predefined' },
          { id: 'b', category: 'Y', prompt: 'p', letter: 'B', source: 'predefined' },
          { id: 'c', category: 'Z', prompt: 'p', letter: 'C', source: 'predefined' },
        ],
      }),
    );
    expect(store.isChallengeChooser).toBe(true);
    expect(store.challengeOptions).toHaveLength(3);
  });

  it('canSubmitWords true for current bidder in WORDS phase', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s1');
    store.setRoom(
      makeRoom({
        phase: 'WORDS',
        currentBidderSocketId: 's1',
        currentBid: 3,
        wasForced: true,
      }),
    );
    expect(store.canSubmitWords).toBe(true);
    expect(store.wasForced).toBe(true);
  });

  it('addRoundResult prepends to history and updates scores', () => {
    const store = useSurenchereStore();
    store.setMySocketId('s1');
    store.setRoom(makeRoom());
    const result: SurenchereRoundResult = {
      bidderSocketId: 's1',
      bidderPseudo: 'Alice',
      challenge: { id: 'c1', category: 'Test', prompt: 'p', letter: 'A', source: 'predefined' },
      bid: 7,
      success: true,
      pointsDelta: 7,
      words: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      forcedBonus: 0,
    };
    store.addRoundResult(result, { Alice: 7, Bob: 0, Carol: 0 });
    expect(store.roundHistory).toHaveLength(1);
    expect(store.roundHistory[0].bidderPseudo).toBe('Alice');
    expect(store.scores.Alice).toBe(7);
    expect(store.phase).toBe('ROUND_END');
  });
});
