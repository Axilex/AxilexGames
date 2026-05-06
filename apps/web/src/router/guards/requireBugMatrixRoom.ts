import { createRoomGuard } from '@/shared/router/createGuards';
import { useBugMatrixSessionStore } from '@/shared/stores/useBugMatrixSessionStore';

export const requireBugMatrixRoom = createRoomGuard(
  () => useBugMatrixSessionStore(),
  'bug-matrix',
);
