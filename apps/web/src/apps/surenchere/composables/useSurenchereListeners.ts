import { useRouter } from 'vue-router';
import { socketService } from '@/shared/services/socket.service';
import { useSurenchereStore } from '../stores/useSurenchereStore';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';

/**
 * Registers all `surenchere:*` socket → store bindings.
 * Called ONCE in App.vue — never in individual pages.
 */
export function useSurenchereListeners(): void {
  const store = useSurenchereStore();
  const session = useSurenchereSessionStore();
  const router = useRouter();

  socketService.onLifecycle('connect', () => {
    if (socketService.id) store.setMySocketId(socketService.id);
  });

  socketService.on('surenchere:room:update', (room) => {
    if (!store.mySocketId && socketService.id) store.setMySocketId(socketService.id);
    store.setRoom(room);
    if (room.code) session.setSession(session.pseudo, room.code);

    if (room.phase === 'WAITING') {
      if (router.currentRoute.value.name !== 'surenchere-lobby') {
        router.push({ name: 'surenchere-lobby' });
      }
    } else if (
      room.phase === 'CHOOSING_CHALLENGE' ||
      room.phase === 'BIDDING' ||
      room.phase === 'WORDS' ||
      room.phase === 'VERDICT' ||
      room.phase === 'ROUND_END'
    ) {
      if (router.currentRoute.value.name !== 'surenchere-game') {
        router.push({ name: 'surenchere-game' });
      }
    }
  });

  socketService.on('surenchere:round:start', (payload) => {
    store.startRound(payload);
    if (router.currentRoute.value.name !== 'surenchere-game') {
      router.push({ name: 'surenchere-game' });
    }
  });

  socketService.on('surenchere:bid:update', (payload) => {
    store.updateBid(payload);
  });

  socketService.on('surenchere:pass:update', (payload) => {
    store.addPass(payload.socketId);
  });

  socketService.on('surenchere:verdict:start', () => {
    // room:update already carries phase=VERDICT, this event is informational
  });

  socketService.on('surenchere:round:end', (payload) => {
    store.addRoundResult(payload.result, payload.scores);
  });

  socketService.on('surenchere:game:finished', (payload) => {
    store.setFinished(payload);
    router.push({ name: 'surenchere-summary' });
  });

  socketService.on('surenchere:error', (payload) => {
    if (payload.code === 'ROOM_NOT_FOUND' && !store.room) {
      // Stale session — room no longer exists, clear and go back to entry page
      session.clearSession();
      store.reset();
      router.push({ name: 'surenchere' });
    } else {
      store.setError(payload.code);
    }
  });
}
