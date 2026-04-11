import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

type Guard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => void;

/**
 * Redirects to `fallbackRouteName` unless the session store reports an active room code.
 * One line per mini-game: `export const requireRoom = createRoomGuard(() => useSessionStore(), 'wikirace')`.
 */
export function createRoomGuard(
  useSession: () => { roomCode: string },
  fallbackRouteName: string,
): Guard {
  return (_to, _from, next) => {
    if (!useSession().roomCode) next({ name: fallbackRouteName });
    else next();
  };
}

/**
 * Redirects to `fallbackRouteName` unless `isActive(store)` returns true.
 * `store` is whatever Pinia store holds the game phase — each caller decides how to read it.
 */
export function createGameGuard<Store>(
  useStore: () => Store,
  isActive: (store: Store) => boolean,
  fallbackRouteName: string,
): Guard {
  return (_to, _from, next) => {
    if (isActive(useStore())) next();
    else next({ name: fallbackRouteName });
  };
}
