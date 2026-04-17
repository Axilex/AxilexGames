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

    // Guard: only process navigation for players who are actually registered in this room.
    // Without this, a player still in the common-lobby socket.io room (same code) would receive
    // broadcasts from other players joining Surenchère and get incorrectly redirected.
    const myId = store.mySocketId || socketService.id;
    const isInRoom = room.players.some((p) => p.socketId === myId);

    store.setRoom(room);
    // Only persist session if we have a pseudo — avoids overwriting it with an empty string
    // when overhearing a broadcast before our own lobby:redirect has fired.
    if (room.code && session.pseudo) session.setSession(session.pseudo, room.code);

    if (!isInRoom) return;

    if (room.phase === 'WAITING') {
      if (router.currentRoute.value.name !== 'surenchere-lobby') {
        router.push({ name: 'surenchere-lobby' });
      }
    } else if (
      room.phase === 'CHOOSING_CHALLENGE' ||
      room.phase === 'BIDDING' ||
      room.phase === 'WORDS' ||
      room.phase === 'VOTING' ||
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

  socketService.on('surenchere:round:end', (payload) => {
    store.addRoundResult(payload.result);
  });

  socketService.on('surenchere:game:finished', (payload) => {
    store.setFinished(payload);
    router.push({ name: 'surenchere-summary' });
  });

  socketService.on('surenchere:timer-update', (payload) => {
    store.setTimerUpdate(payload.phase, payload.endsAt);
  });

  socketService.on('surenchere:vote-update', (payload) => {
    store.setVoteUpdate(payload.votes);
  });

  socketService.on('surenchere:typing-update', (payload) => {
    store.setTyping(payload);
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
