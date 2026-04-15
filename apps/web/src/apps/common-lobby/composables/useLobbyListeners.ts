import { useRouter } from 'vue-router';
import { socketService } from '@/shared/services/socket.service';
import { useCommonLobbyStore } from '../stores/useCommonLobbyStore';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';

/**
 * Registers all `lobby:*` socket → store bindings.
 * Called ONCE in App.vue — never in individual pages.
 */
export function useLobbyListeners(): void {
  const store = useCommonLobbyStore();
  const session = useCommonSessionStore();
  const wikiSession = useSessionStore();
  const surenchereSession = useSurenchereSessionStore();
  const router = useRouter();

  socketService.on('lobby:room-update', (room) => {
    store.setRoom(room);
    if (room.code) session.setSession(session.pseudo, room.code);
    // Only auto-navigate when the room returns to WAITING (e.g. host resets after a game)
    // Don't interrupt players who are in the middle of a game
    if (
      room.status === 'WAITING' &&
      session.roomCode &&
      router.currentRoute.value.name !== 'common-lobby'
    ) {
      router.push({ name: 'common-lobby', params: { code: room.code } });
    }
  });

  socketService.on('lobby:redirect', ({ game, code }) => {
    const pseudo = session.pseudo;
    // Keep the common session alive so players can return to this lobby after the game

    if (game === 'surenchere') {
      surenchereSession.setSession(pseudo, '');
      router.push({ name: 'surenchere', query: { code: code ?? '', autoJoin: '1' } });
    } else {
      wikiSession.setSession(pseudo, '');
      router.push({ name: 'wikirace', query: { code: code ?? '', autoJoin: '1' } });
    }
  });

  socketService.on('lobby:error', (payload) => {
    store.setError(payload.code);
  });
}
