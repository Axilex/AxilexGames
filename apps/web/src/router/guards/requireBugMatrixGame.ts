import { createGameGuard } from '@/shared/router/createGuards';
import { useBugMatrixStore } from '@/apps/bug-matrix/stores/useBugMatrixStore';

export const requireBugMatrixGame = createGameGuard(
  () => useBugMatrixStore(),
  (store) => store.phase !== 'WAITING' && store.phase !== 'FINISHED',
  'bug-matrix-lobby',
);
