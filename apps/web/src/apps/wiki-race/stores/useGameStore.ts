import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  GameStateDTO,
  GameSummary,
  WikipediaPage,
  PlayerProgressDTO,
  NavigationStep,
} from '@wiki-race/shared';
import { GameMode } from '@wiki-race/shared';
import type { BingoConstraintId } from '@wiki-race/shared';

export const useGameStore = defineStore('game', () => {
  const gameState = ref<GameStateDTO | null>(null);
  const summary = ref<GameSummary | null>(null);
  const currentPage = ref<WikipediaPage | null>(null);
  const localHistory = ref<NavigationStep[]>([]);
  const navigationError = ref<string | null>(null);
  const isNavigating = ref(false);
  const recentlyValidatedBingo = ref<BingoConstraintId[]>([]);

  const isInProgress = computed(() => gameState.value !== null && summary.value === null);
  const targetSlug = computed(() => gameState.value?.targetSlug ?? null);
  const startSlug = computed(() => gameState.value?.startSlug ?? '');
  const mode = computed(() => gameState.value?.mode ?? GameMode.CLASSIC);
  const clickLimit = computed(() => gameState.value?.clickLimit ?? null);
  const bingoConstraints = computed(() => gameState.value?.bingoConstraints ?? null);

  function setGameState(state: GameStateDTO): void {
    gameState.value = state;
    summary.value = null;
    localHistory.value = [];
    recentlyValidatedBingo.value = [];
  }

  function setCurrentPage(page: WikipediaPage): void {
    if (currentPage.value && currentPage.value.slug !== page.slug) {
      localHistory.value.push({
        from: currentPage.value.slug,
        to: page.slug,
        timestamp: Date.now(),
      });
    }
    currentPage.value = page;
    isNavigating.value = false;
    navigationError.value = null;
  }

  function updatePlayerProgress(progress: PlayerProgressDTO): void {
    if (!gameState.value) return;
    const idx = gameState.value.playerStatuses.findIndex((p) => p.pseudo === progress.pseudo);
    if (idx !== -1) {
      gameState.value.playerStatuses[idx] = progress;
    }
  }

  function setFinished(gameSummary: GameSummary): void {
    summary.value = gameSummary;
  }

  function setNavigationError(message: string): void {
    navigationError.value = message;
    isNavigating.value = false;
  }

  function setNavigating(): void {
    isNavigating.value = true;
    navigationError.value = null;
  }

  function setBingoValidated(ids: BingoConstraintId[], _slug: string): void {
    recentlyValidatedBingo.value = ids;
  }

  function reset(): void {
    gameState.value = null;
    summary.value = null;
    currentPage.value = null;
    localHistory.value = [];
    navigationError.value = null;
    isNavigating.value = false;
    recentlyValidatedBingo.value = [];
  }

  return {
    gameState,
    summary,
    currentPage,
    localHistory,
    navigationError,
    isNavigating,
    recentlyValidatedBingo,
    isInProgress,
    targetSlug,
    startSlug,
    mode,
    clickLimit,
    bingoConstraints,
    setGameState,
    setCurrentPage,
    updatePlayerProgress,
    setFinished,
    setNavigationError,
    setNavigating,
    setBingoValidated,
    reset,
    // Re-export enums for template use
    GameMode,
  };
});
