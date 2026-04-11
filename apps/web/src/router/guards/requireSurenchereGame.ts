import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useSurenchereStore } from '@/apps/surenchere/stores/useSurenchereStore';

export function requireSurenchereGame(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  const store = useSurenchereStore();
  if (store.phase === 'WAITING' || store.phase === 'FINISHED') {
    next({ name: 'surenchere-lobby' });
  } else {
    next();
  }
}
