import { useRouter } from 'vue-router';
import { socketService } from '@/shared/services/socket.service';
import { useBugMatrixStore } from '../stores/useBugMatrixStore';
import { useBugMatrixSessionStore } from '@/shared/stores/useBugMatrixSessionStore';

/**
 * Registers all `bugmatrix:*` socket → store bindings.
 * Called ONCE in App.vue — never in individual pages.
 */
export function useBugMatrixListeners(): void {
  const store = useBugMatrixStore();
  const session = useBugMatrixSessionStore();
  const router = useRouter();

  socketService.onLifecycle('connect', () => {
    if (socketService.id) store.setMySocketId(socketService.id);
  });

  socketService.on('bugmatrix:session', ({ token }) => {
    session.setSessionToken(token);
  });

  socketService.on('bugmatrix:room-update', (room) => {
    if (!store.mySocketId && socketService.id) store.setMySocketId(socketService.id);
    const myId = store.mySocketId || socketService.id;
    const isInRoom = room.players.some((p) => p.socketId === myId);

    store.setRoom(room);
    if (room.code && session.pseudo) session.setSession(session.pseudo, room.code);

    if (!isInRoom) return;

    const target = pickRoute(room.phase);
    if (target && router.currentRoute.value.name !== target) {
      router.push({ name: target });
    }
  });

  socketService.on('bugmatrix:secret-role', ({ role, ruleLabel, ruleCategory }) => {
    store.setMyRole(role, ruleLabel, ruleCategory);
  });

  socketService.on('bugmatrix:theme', () => {
    // No-op: themeLabel arrives via room-update too. Keeping the listener so we don't
    // log unhandled events; we could surface it as a flash banner later.
  });

  socketService.on('bugmatrix:phase-start', ({ phase, timerMs }) => {
    if (typeof timerMs === 'number') store.setPhaseTimer(phase, Date.now() + timerMs);
  });

  socketService.on('bugmatrix:question', (q) => {
    store.setCurrentQuestion(q);
  });

  socketService.on('bugmatrix:round-result', (_result) => {
    // The room-update that arrives in the same tick has phase=REVEAL with lastResult.
    // No need to mirror the event payload separately — the store reads room.lastResult.
  });

  socketService.on('bugmatrix:game-finished', ({ rankings }) => {
    store.setFinished(rankings);
    if (router.currentRoute.value.name !== 'bug-matrix-summary') {
      router.push({ name: 'bug-matrix-summary' });
    }
  });

  socketService.on('bugmatrix:error', (payload) => {
    if (payload.code === 'ROOM_NOT_FOUND' && !store.room) {
      session.clearSession();
      store.reset();
      router.push({ name: 'bug-matrix' });
    } else {
      store.setError(payload.code);
    }
  });
}

function pickRoute(phase: string): string | null {
  if (phase === 'WAITING') return 'bug-matrix-lobby';
  if (phase === 'BRIEF' || phase === 'DISCUSSION' || phase === 'VOTE' || phase === 'REVEAL') {
    return 'bug-matrix-game';
  }
  if (phase === 'FINISHED') return 'bug-matrix-summary';
  return null;
}
