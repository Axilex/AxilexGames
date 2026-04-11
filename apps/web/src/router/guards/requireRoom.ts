import { createRoomGuard } from '@/shared/router/createGuards';
import { useSessionStore } from '@/shared/stores/useSessionStore';

export const requireRoom = createRoomGuard(() => useSessionStore(), 'wikirace');
