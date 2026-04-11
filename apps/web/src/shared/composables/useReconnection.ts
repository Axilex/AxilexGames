import { ref, watch } from 'vue';
import { useSocketStore } from '@/shared/stores/useSocketStore';

interface SessionLike {
  pseudo: string;
  roomCode: string;
}

/**
 * Watches the socket store and, after a genuine drop/reconnect, flags `pendingRejoin` so the
 * `DisconnectOverlay` can show a "Rejoindre" button. `rejoin()` fires the game-specific rejoin
 * callback (passed in by the caller) using the preserved session.
 */
export function useReconnection(
  session: () => SessionLike,
  rejoinFn: (roomCode: string, pseudo: string) => void,
) {
  const socketStore = useSocketStore();
  const hasDisconnected = ref(false);

  watch(
    () => socketStore.isConnected,
    (connected) => {
      if (!connected) {
        hasDisconnected.value = true;
        return;
      }
      if (hasDisconnected.value) {
        const { roomCode, pseudo } = session();
        if (roomCode && pseudo) socketStore.setPendingRejoin(true);
        hasDisconnected.value = false;
      }
    },
  );

  function doRejoin(): void {
    const { roomCode, pseudo } = session();
    if (roomCode && pseudo) rejoinFn(roomCode, pseudo);
    socketStore.setPendingRejoin(false);
  }

  return { doRejoin };
}
