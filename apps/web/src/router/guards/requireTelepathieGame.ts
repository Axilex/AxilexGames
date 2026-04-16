import { createGameGuard } from '@/shared/router/createGuards';
import { useTelepathieStore } from '@/apps/telepathie/stores/useTelepathieStore';

export const requireTelepathieGame = createGameGuard(
  () => useTelepathieStore(),
  (store) => store.phase !== 'WAITING' && store.phase !== 'FINISHED',
  'telepathie-lobby',
);
