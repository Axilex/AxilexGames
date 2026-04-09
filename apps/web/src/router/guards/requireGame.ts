import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useGameStore } from '@/apps/wiki-race/stores/useGameStore';

export function requireGame(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  const gameStore = useGameStore();
  if (!gameStore.isInProgress) {
    next({ name: 'lobby' });
  } else {
    next();
  }
}
