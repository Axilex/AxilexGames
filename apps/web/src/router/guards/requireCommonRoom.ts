import { createRoomGuard } from '@/shared/router/createGuards';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';

export const requireCommonRoom = createRoomGuard(() => useCommonSessionStore(), 'home');
