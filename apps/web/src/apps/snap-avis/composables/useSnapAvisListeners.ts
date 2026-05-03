import { useRouter } from 'vue-router';
import { socketService } from '@/shared/services/socket.service';
import { useSnapAvisStore } from '../stores/useSnapAvisStore';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';

/**
 * Enregistre tous les bindings `snapavis:*` socket → store.
 * Appelé UNE SEULE FOIS dans App.vue.
 */
export function useSnapAvisListeners(): void {
  const store = useSnapAvisStore();
  const session = useSnapAvisSessionStore();
  const router = useRouter();

  socketService.onLifecycle('connect', () => {
    if (socketService.id) store.setMySocketId(socketService.id);
  });

  socketService.on('snapavis:session', ({ token }) => {
    session.setSessionToken(token);
  });

  socketService.on('snapavis:room-update', (room) => {
    if (!store.mySocketId && socketService.id) store.setMySocketId(socketService.id);

    const myId = store.mySocketId || socketService.id;
    const isInRoom = room.players.some((p) => p.socketId === myId);

    store.setRoom(room);
    if (room.code && session.pseudo) session.setSession(session.pseudo, room.code);

    if (!isInRoom) return;

    if (room.phase === 'WAITING') {
      if (router.currentRoute.value.name !== 'snap-avis-lobby') {
        void router.push({ name: 'snap-avis-lobby' });
      }
    } else if (['REVEALING', 'WRITING', 'RESULTS', 'ROUND_END'].includes(room.phase)) {
      // Ne pas revenir sur la page de jeu si la partie est déjà terminée côté client
      // (évite qu'un leave depuis le podium renvoie les autres sur la dernière manche).
      if (store.rankings.length > 0) return;
      if (router.currentRoute.value.name !== 'snap-avis-game') {
        void router.push({ name: 'snap-avis-game' });
      }
    }
  });

  socketService.on('snapavis:round-start', (data) => {
    store.onRoundStart(data);
    if (router.currentRoute.value.name !== 'snap-avis-game') {
      void router.push({ name: 'snap-avis-game' });
    }
  });

  socketService.on('snapavis:writing-start', (data) => {
    store.onWritingStart(data);
  });

  socketService.on('snapavis:word-received', (data) => {
    store.onWordReceived(data);
  });

  socketService.on('snapavis:results', (result) => {
    store.onResults(result);
  });

  socketService.on('snapavis:game-finished', (data) => {
    store.onGameFinished(data);
    void router.push({ name: 'snap-avis-summary' });
  });

  socketService.on('snapavis:error', (payload) => {
    if (payload.code === 'ROOM_NOT_FOUND' && !store.room) {
      session.clearSession();
      store.reset();
      void router.push({ name: 'snap-avis' });
    } else {
      store.setError(payload.code);
    }
  });
}
