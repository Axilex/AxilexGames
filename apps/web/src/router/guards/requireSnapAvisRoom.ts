import { createRoomGuard } from '@/shared/router/createGuards';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';

export const requireSnapAvisRoom = createRoomGuard(() => useSnapAvisSessionStore(), 'snap-avis');
