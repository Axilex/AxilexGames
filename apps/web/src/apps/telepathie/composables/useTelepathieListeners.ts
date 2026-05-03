import { useRouter } from 'vue-router';
import { socketService } from '@/shared/services/socket.service';
import { useTelepathieStore } from '../stores/useTelepathieStore';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';

/**
 * Enregistre tous les bindings `telepathie:*` socket → store.
 * Appelé UNE SEULE FOIS dans App.vue.
 */
export function useTelepathieListeners(): void {
  const store = useTelepathieStore();
  const session = useTelepathieSessionStore();
  const router = useRouter();

  socketService.onLifecycle('connect', () => {
    if (socketService.id) store.setMySocketId(socketService.id);
  });

  socketService.on('telepathie:session', ({ token }) => {
    session.setSessionToken(token);
  });

  socketService.on('telepathie:room-update', (room) => {
    if (!store.mySocketId && socketService.id) store.setMySocketId(socketService.id);

    const myId = store.mySocketId || socketService.id;
    const isInRoom = room.players.some((p) => p.socketId === myId);

    store.setRoom(room);
    if (room.code && session.pseudo) session.setSession(session.pseudo, room.code);

    if (!isInRoom) return;

    if (room.phase === 'WAITING') {
      if (router.currentRoute.value.name !== 'telepathie-lobby') {
        void router.push({ name: 'telepathie-lobby' });
      }
    } else if (['CHOOSING', 'PLAYING', 'ROUND_RESULT', 'MANCHE_RESULT'].includes(room.phase)) {
      if (store.rankings.length > 0) return;
      if (router.currentRoute.value.name !== 'telepathie-game') {
        void router.push({ name: 'telepathie-game' });
      }
    }
  });

  socketService.on('telepathie:choose-open', (data) => {
    store.onChooseOpen(data);
    if (router.currentRoute.value.name !== 'telepathie-game') {
      void router.push({ name: 'telepathie-game' });
    }
  });

  socketService.on('telepathie:input-open', (data) => {
    store.onInputOpen(data);
    if (router.currentRoute.value.name !== 'telepathie-game') {
      void router.push({ name: 'telepathie-game' });
    }
  });

  socketService.on('telepathie:word-received', (data) => {
    store.onWordReceived(data);
  });

  socketService.on('telepathie:round-result', (result) => {
    store.onRoundResult(result);
  });

  socketService.on('telepathie:manche-result', (result) => {
    store.onMancheResult(result);
  });

  socketService.on('telepathie:game-finished', (data) => {
    store.onGameFinished(data);
    void router.push({ name: 'telepathie-summary' });
  });

  socketService.on('telepathie:error', (payload) => {
    if (payload.code === 'ROOM_NOT_FOUND' && !store.room) {
      session.clearSession();
      store.reset();
      void router.push({ name: 'telepathie' });
    } else {
      store.setError(payload.code);
    }
  });
}
