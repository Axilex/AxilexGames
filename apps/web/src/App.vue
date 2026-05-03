<template>
  <router-view />
  <DisconnectOverlay :on-reconnect="doRejoin" />
</template>

<script setup lang="ts">
import { socketService } from '@/shared/services/socket.service';
import { useSocketListeners } from '@/apps/wiki-race/composables/useSocketListeners';
import { useSurenchereListeners } from '@/apps/surenchere/composables/useSurenchereListeners';
import { useLobbyListeners } from '@/apps/common-lobby/composables/useLobbyListeners';
import { useSnapAvisListeners } from '@/apps/snap-avis/composables/useSnapAvisListeners';
import { useTelepathieListeners } from '@/apps/telepathie/composables/useTelepathieListeners';
import { useReconnection } from '@/shared/composables/useReconnection';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';
import { lobbyService } from '@/apps/wiki-race/services/lobby.service';
import { surenchereSocket } from '@/apps/surenchere/services/surenchere.service';
import { lobbySocket } from '@/apps/common-lobby/services/lobby.service';
import { snapAvisSocket } from '@/apps/snap-avis/services/snap-avis.service';
import { telepathieSocket } from '@/apps/telepathie/services/telepathie.service';
import DisconnectOverlay from '@/shared/components/ui/DisconnectOverlay.vue';

// Connect first so the socket object exists before listeners are registered
socketService.connect();
useSocketListeners();
useSurenchereListeners();
useLobbyListeners();
useSnapAvisListeners();
useTelepathieListeners();

const wikiSession = useSessionStore();
const surenchereSession = useSurenchereSessionStore();
const commonSession = useCommonSessionStore();
const snapAvisSession = useSnapAvisSessionStore();
const telepathieSession = useTelepathieSessionStore();

// Single reconnection watcher: whichever session has an active roomCode drives
// the rejoin. Common-lobby takes precedence so a player on the lobby page after
// a redirect doesn't get pulled back into the previous game's session. Each
// rejoin replays the persisted `sessionToken` so the server can re-bind the
// disconnected slot rather than treat it as a fresh impersonation attempt.
type Rejoin = (roomCode: string, pseudo: string, sessionToken?: string) => void;
const sessionPrecedence: Array<{
  session: { roomCode: string; pseudo: string; sessionToken: string };
  rejoin: Rejoin;
}> = [
  { session: commonSession, rejoin: lobbySocket.join.bind(lobbySocket) },
  { session: wikiSession, rejoin: lobbyService.joinRoom.bind(lobbyService) },
  { session: surenchereSession, rejoin: surenchereSocket.join.bind(surenchereSocket) },
  { session: snapAvisSession, rejoin: snapAvisSocket.join.bind(snapAvisSocket) },
  { session: telepathieSession, rejoin: telepathieSocket.join.bind(telepathieSocket) },
];

function activeSession() {
  return sessionPrecedence.find((entry) => entry.session.roomCode);
}

const { doRejoin } = useReconnection(
  () => {
    const active = activeSession();
    return active
      ? { pseudo: active.session.pseudo, roomCode: active.session.roomCode }
      : { pseudo: '', roomCode: '' };
  },
  (roomCode, pseudo) => {
    const active = activeSession();
    if (!active) return;
    active.rejoin(roomCode, pseudo, active.session.sessionToken || undefined);
  },
);
</script>
