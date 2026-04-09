import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useSessionStore } from '@/shared/stores/useSessionStore';

export function requireRoom(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  const sessionStore = useSessionStore();
  if (!sessionStore.roomCode) {
    next({ name: 'wikirace' });
  } else {
    next();
  }
}
