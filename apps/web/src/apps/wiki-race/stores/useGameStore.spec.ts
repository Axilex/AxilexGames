import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStore } from './useGameStore';
import { PlayerStatus, GameMode } from '@wiki-race/shared';
import type {
  GameStateDTO,
  WikipediaPage,
  GameSummary,
  PlayerProgressDTO,
} from '@wiki-race/shared';

const mockPlayerProgress = (pseudo: string): PlayerProgressDTO => ({
  pseudo,
  status: PlayerStatus.CONNECTED,
  hopCount: 0,
  currentSlug: 'France',
  clicksLeft: null,
  bingoValidated: [],
});

const mockState: GameStateDTO = {
  roomCode: 'ABCDEF',
  mode: GameMode.CLASSIC,
  startSlug: 'France',
  targetSlug: 'Tour_Eiffel',
  startTime: Date.now(),
  timeLimitSeconds: null,
  clickLimit: null,
  bingoConstraints: null,
  playerStatuses: [mockPlayerProgress('Alice'), mockPlayerProgress('Bob')],
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

  it('setGameState exposes mode and clickLimit', () => {
    const store = useGameStore();
    store.setGameState({ ...mockState, mode: GameMode.BINGO, clickLimit: 5 });
    expect(store.mode).toBe(GameMode.BINGO);
    expect(store.clickLimit).toBe(5);
  });

  it('targetSlug returns null when no gameState', () => {
    const store = useGameStore();
    expect(store.targetSlug).toBeNull();
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
      clicksLeft: null,
      bingoValidated: [],
    };
    store.updatePlayerProgress(progress);

    const alice = store.gameState?.playerStatuses.find((p) => p.pseudo === 'Alice');
    expect(alice?.hopCount).toBe(2);
    expect(alice?.currentSlug).toBe('Paris');
  });

  it('setBingoValidated updates recentlyValidatedBingo', () => {
    const store = useGameStore();
    store.setBingoValidated(['year_in_title', 'city'], 'Paris');
    expect(store.recentlyValidatedBingo).toEqual(['year_in_title', 'city']);
  });

  it('setFinished stores summary and isInProgress becomes false', () => {
    const store = useGameStore();
    store.setGameState(mockState);

    const summary: GameSummary = {
      roomCode: 'ABCDEF',
      mode: GameMode.CLASSIC,
      startSlug: 'France',
      targetSlug: 'Tour_Eiffel',
      startTime: mockState.startTime,
      endTime: Date.now(),
      timeLimitSeconds: null,
      clickLimit: null,
      winnerPseudo: 'Alice',
      bingoConstraintIds: null,
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
