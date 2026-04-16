import { createRoomGuard } from '@/shared/router/createGuards';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';

export const requireTelepathieRoom = createRoomGuard(
  () => useTelepathieSessionStore(),
  'telepathie',
);
