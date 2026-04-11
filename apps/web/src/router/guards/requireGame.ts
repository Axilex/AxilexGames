import { createGameGuard } from '@/shared/router/createGuards';
import { useGameStore } from '@/apps/wiki-race/stores/useGameStore';

export const requireGame = createGameGuard(
  () => useGameStore(),
  (store) => store.isInProgress,
  'lobby',
);
