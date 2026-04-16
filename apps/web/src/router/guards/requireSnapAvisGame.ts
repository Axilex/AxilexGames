import { createGameGuard } from '@/shared/router/createGuards';
import { useSnapAvisStore } from '@/apps/snap-avis/stores/useSnapAvisStore';

export const requireSnapAvisGame = createGameGuard(
  () => useSnapAvisStore(),
  (store) => store.phase !== 'WAITING' && store.phase !== 'FINISHED',
  'snap-avis-lobby',
);
