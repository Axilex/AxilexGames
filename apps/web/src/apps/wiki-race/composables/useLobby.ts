import { useRouter } from 'vue-router';
import { lobbyService } from '../services/lobby.service';
import { useLobbyStore } from '../stores/useLobbyStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';

export function useLobby() {
  const lobbyStore = useLobbyStore();
  const sessionStore = useSessionStore();
  const router = useRouter();

  function createRoom(pseudo: string): void {
    lobbyStore.clearError();
    sessionStore.setSession(pseudo, '');
    lobbyService.createRoom(pseudo);
  }

  function joinRoom(roomCode: string, pseudo: string): void {
    lobbyStore.clearError();
    sessionStore.setSession(pseudo, roomCode);
    lobbyService.joinRoom(roomCode, pseudo);
  }

  function leaveRoom(): void {
    const code = sessionStore.roomCode;
    if (code) lobbyService.leaveRoom(code);
    sessionStore.clearSession();
    lobbyStore.reset();
    router.push({ name: 'wikirace' });
  }

  return { createRoom, joinRoom, leaveRoom, lobbyStore };
}
