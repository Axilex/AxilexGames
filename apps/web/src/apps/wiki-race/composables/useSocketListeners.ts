import { useRouter } from 'vue-router';
import { socketService } from '@/shared/services/socket.service';
import { useLobbyStore } from '../stores/useLobbyStore';
import { useGameStore } from '../stores/useGameStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useSocketStore } from '@/shared/stores/useSocketStore';

const STALE_SESSION_ERRORS = ['ROOM_NOT_FOUND', 'GAME_NOT_IN_PROGRESS'];

/**
 * Registers all socket → store event bindings for WikiRace.
 * Called ONCE in App.vue — never in individual pages/components.
 */
export function useSocketListeners() {
  const lobbyStore = useLobbyStore();
  const gameStore = useGameStore();
  const sessionStore = useSessionStore();
  const socketStore = useSocketStore();
  const router = useRouter();

  // Lifecycle
  socketService.onLifecycle('connect', () => {
    socketStore.setConnected(true);
    if (socketService.id) sessionStore.setSocketId(socketService.id);
  });
  socketService.onLifecycle('disconnect', () => {
    socketStore.setConnected(false);
    socketStore.setReconnecting(true);
  });

  // Lobby
  socketService.on('room:update', (room) => {
    lobbyStore.setRoom(room);
    if (room.code) sessionStore.setSession(sessionStore.pseudo, room.code);
  });

  // Game lifecycle
  socketService.on('game:state', (state) => {
    gameStore.setGameState(state);
    if (router.currentRoute.value.name !== 'game') {
      router.push({ name: 'game' });
    }
  });
  socketService.on('game:page', (page) => {
    gameStore.setCurrentPage(page);
  });
  socketService.on('player:progress', (progress) => {
    gameStore.updatePlayerProgress(progress);
  });
  socketService.on('game:finished', (summary) => {
    gameStore.setFinished(summary);
    router.push({ name: 'summary' });
  });
  socketService.on('navigation:error', (error) => {
    gameStore.setNavigationError(error.message);
  });

  // Errors
  socketService.on('error', (message) => {
    if (STALE_SESSION_ERRORS.some((e) => message.includes(e))) {
      // Room no longer exists (backend restarted or room expired) — clear stale session
      sessionStore.clearSession();
      gameStore.reset();
      lobbyStore.reset();
      router.push({ name: 'wikirace' });
    } else {
      lobbyStore.setError(message);
    }
  });
}
