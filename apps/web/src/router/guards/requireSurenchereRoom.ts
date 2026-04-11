import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';

export function requireSurenchereRoom(
  _to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): void {
  const session = useSurenchereSessionStore();
  if (!session.roomCode) {
    next({ name: 'surenchere' });
  } else {
    next();
  }
}
