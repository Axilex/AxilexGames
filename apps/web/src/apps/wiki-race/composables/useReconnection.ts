import { ref, watch } from 'vue';
import { lobbyService } from '../services/lobby.service';
import { useSocketStore } from '@/shared/stores/useSocketStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';

export function useReconnection() {
  const socketStore = useSocketStore();
  const sessionStore = useSessionStore();
  const hasDisconnected = ref(false);

  watch(
    () => socketStore.isConnected,
    (connected) => {
      if (!connected) {
        hasDisconnected.value = true;
        return;
      }
      // Socket reconnected after a real disconnect — show the manual rejoin button
      if (hasDisconnected.value) {
        const { roomCode, pseudo } = sessionStore;
        if (roomCode && pseudo) {
          socketStore.setPendingRejoin(true);
        }
        hasDisconnected.value = false;
      }
    },
  );

  function doRejoin(): void {
    const { roomCode, pseudo } = sessionStore;
    if (roomCode && pseudo) {
      lobbyService.joinRoom(roomCode, pseudo);
    }
    socketStore.setPendingRejoin(false);
  }

  return { doRejoin };
}
