import { useRouter } from 'vue-router';
import { socketService } from '@/shared/services/socket.service';
import { useCommonLobbyStore } from '../stores/useCommonLobbyStore';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';

/**
 * Registers all `lobby:*` socket → store bindings.
 * Called ONCE in App.vue — never in individual pages.
 */
export function useLobbyListeners(): void {
  const store = useCommonLobbyStore();
  const session = useCommonSessionStore();
  const wikiSession = useSessionStore();
  const surenchereSession = useSurenchereSessionStore();
  const snapAvisSession = useSnapAvisSessionStore();
  const telepathieSession = useTelepathieSessionStore();
  const router = useRouter();

  socketService.on('lobby:session', ({ token }) => {
    session.setSessionToken(token);
  });

  socketService.on('lobby:room-update', (room) => {
    store.setRoom(room);
    // Only persist when we own a pseudo for this room — overhearing a stale broadcast
    // before our own join shouldn't blank our session.
    if (room.code && session.pseudo) session.setSession(session.pseudo, room.code);

    // Only auto-navigate when:
    //  - the room is back in WAITING (don't interrupt mid-game players),
    //  - this update is for OUR room (avoid hijacking on a stale broadcast),
    //  - we're not already on the lobby page.
    if (
      room.status === 'WAITING' &&
      session.roomCode === room.code &&
      router.currentRoute.value.name !== 'common-lobby'
    ) {
      router.push({ name: 'common-lobby', params: { code: room.code } });
    }
  });

  socketService.on('lobby:redirect', ({ game, code }) => {
    const pseudo = session.pseudo;
    // Keep the common session alive so players can return to this lobby after the game
    // Flag the store so LobbyCommonPage hides the IN_GAME panel while navigating away.
    store.redirecting = true;

    if (game === 'surenchere') {
      surenchereSession.setSession(pseudo, '');
      router.push({ name: 'surenchere', query: { code: code ?? '', autoJoin: '1' } });
    } else if (game === 'snap-avis') {
      snapAvisSession.setSession(pseudo, '');
      router.push({ name: 'snap-avis', query: { code: code ?? '', autoJoin: '1' } });
    } else if (game === 'telepathie') {
      telepathieSession.setSession(pseudo, '');
      router.push({ name: 'telepathie', query: { code: code ?? '', autoJoin: '1' } });
    } else {
      wikiSession.setSession(pseudo, '');
      router.push({ name: 'wikirace', query: { code: code ?? '', autoJoin: '1' } });
    }
  });

  socketService.on('lobby:error', (payload) => {
    store.setError(payload.code);
  });
}
