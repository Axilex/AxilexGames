import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from './useGameStore';
import { PlayerStatus } from '@wiki-race/shared';
import type {
  GameStateDTO,
  WikipediaPage,
  GameSummary,
  PlayerProgressDTO,
} from '@wiki-race/shared';

const mockState: GameStateDTO = {
  roomCode: 'ABCDEF',
  startSlug: 'France',
  targetSlug: 'Tour_Eiffel',
  startTime: Date.now(),
  timeLimitSeconds: null,
  playerStatuses: [
    { pseudo: 'Alice', status: PlayerStatus.CONNECTED, hopCount: 0, currentSlug: 'France' },
    { pseudo: 'Bob', status: PlayerStatus.CONNECTED, hopCount: 0, currentSlug: 'France' },
  ],
};

const mockPage: WikipediaPage = {
  slug: 'Paris',
  title: 'Paris',
  htmlContent: '<p>Paris</p>',
};

describe('useGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with nulls', () => {
    const store = useGameStore();
    expect(store.gameState).toBeNull();
    expect(store.currentPage).toBeNull();
    expect(store.summary).toBeNull();
    expect(store.isInProgress).toBe(false);
  });

  it('setGameState stores state and clears summary', () => {
    const store = useGameStore();
    store.setGameState(mockState);
    expect(store.gameState?.startSlug).toBe('France');
    expect(store.targetSlug).toBe('Tour_Eiffel');
    expect(store.isInProgress).toBe(true);
  });

  it('setCurrentPage stores page and clears navigating flag', () => {
    const store = useGameStore();
    store.setNavigating();
    expect(store.isNavigating).toBe(true);
    store.setCurrentPage(mockPage);
    expect(store.currentPage?.slug).toBe('Paris');
    expect(store.isNavigating).toBe(false);
  });

  it('updatePlayerProgress updates the right player', () => {
    const store = useGameStore();
    store.setGameState(mockState);

    const progress: PlayerProgressDTO = {
      pseudo: 'Alice',
      status: PlayerStatus.CONNECTED,
      hopCount: 2,
      currentSlug: 'Paris',
    };
    store.updatePlayerProgress(progress);

    const alice = store.gameState?.playerStatuses.find((p) => p.pseudo === 'Alice');
    expect(alice?.hopCount).toBe(2);
    expect(alice?.currentSlug).toBe('Paris');
  });

  it('setFinished stores summary and isInProgress becomes false', () => {
    const store = useGameStore();
    store.setGameState(mockState);

    const summary: GameSummary = {
      roomCode: 'ABCDEF',
      startSlug: 'France',
      targetSlug: 'Tour_Eiffel',
      startTime: mockState.startTime,
      endTime: Date.now(),
      timeLimitSeconds: null,
      winnerPseudo: 'Alice',
      players: [],
    };
    store.setFinished(summary);

    expect(store.summary?.winnerPseudo).toBe('Alice');
    expect(store.isInProgress).toBe(false);
  });

  it('setNavigationError stores error and clears navigating', () => {
    const store = useGameStore();
    store.setNavigating();
    store.setNavigationError('INVALID_NAVIGATION');
    expect(store.navigationError).toBe('INVALID_NAVIGATION');
    expect(store.isNavigating).toBe(false);
  });

  it('reset clears all state', () => {
    const store = useGameStore();
    store.setGameState(mockState);
    store.setCurrentPage(mockPage);
    store.reset();
    expect(store.gameState).toBeNull();
    expect(store.currentPage).toBeNull();
    expect(store.isInProgress).toBe(false);
  });
});
