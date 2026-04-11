import { createRoomGuard } from '@/shared/router/createGuards';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';

export const requireSurenchereRoom = createRoomGuard(
  () => useSurenchereSessionStore(),
  'surenchere',
);
