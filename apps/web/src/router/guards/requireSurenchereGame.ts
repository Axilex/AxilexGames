import { createGameGuard } from '@/shared/router/createGuards';
import { useSurenchereStore } from '@/apps/surenchere/stores/useSurenchereStore';

export const requireSurenchereGame = createGameGuard(
  () => useSurenchereStore(),
  (store) => store.phase !== 'WAITING' && store.phase !== 'FINISHED',
  'surenchere-lobby',
);
