import { socketService } from '../services/socket.service';
import { useSocketStore } from '../stores/useSocketStore';
import { useSessionStore } from '../stores/useSessionStore';

export function useSocket() {
  const socketStore = useSocketStore();
  const sessionStore = useSessionStore();

  function connect(): void {
    socketService.connect();

    const onConnect = () => {
      socketStore.setConnected(true);
      if (socketService.id) sessionStore.setSocketId(socketService.id);
    };
    const onDisconnect = () => {
      socketStore.setConnected(false);
      socketStore.setReconnecting(true);
    };
    const onConnectError = () => {
      // Socket.IO retries internally (reconnectionAttempts), but surface the state
      // so the UI can show a "reconnecting…" hint instead of looking idle.
      socketStore.setConnected(false);
      socketStore.setReconnecting(true);
    };

    socketService.onLifecycle('connect', onConnect);
    socketService.onLifecycle('disconnect', onDisconnect);
    socketService.onLifecycle('connect_error', onConnectError);
  }

  function disconnect(): void {
    socketService.disconnect();
    socketStore.setConnected(false);
  }

  return { connect, disconnect, socketStore };
}
