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

// One reconnection watcher per game — whichever session has an active roomCode drives the rejoin.
const { doRejoin: rejoinWiki } = useReconnection(
  () => ({ pseudo: wikiSession.pseudo, roomCode: wikiSession.roomCode }),
  (roomCode, pseudo) => lobbyService.joinRoom(roomCode, pseudo),
);
const { doRejoin: rejoinSurenchere } = useReconnection(
  () => ({ pseudo: surenchereSession.pseudo, roomCode: surenchereSession.roomCode }),
  (roomCode, pseudo) => surenchereSocket.join(roomCode, pseudo),
);
const { doRejoin: rejoinCommonLobby } = useReconnection(
  () => ({ pseudo: commonSession.pseudo, roomCode: commonSession.roomCode }),
  (roomCode, pseudo) => lobbySocket.join(roomCode, pseudo),
);
const { doRejoin: rejoinSnapAvis } = useReconnection(
  () => ({ pseudo: snapAvisSession.pseudo, roomCode: snapAvisSession.roomCode }),
  (roomCode, pseudo) => snapAvisSocket.join(roomCode, pseudo),
);
const { doRejoin: rejoinTelepathie } = useReconnection(
  () => ({ pseudo: telepathieSession.pseudo, roomCode: telepathieSession.roomCode }),
  (roomCode, pseudo) => telepathieSocket.join(roomCode, pseudo),
);

function doRejoin(): void {
  if (commonSession.roomCode) rejoinCommonLobby();
  else if (wikiSession.roomCode) rejoinWiki();
  else if (surenchereSession.roomCode) rejoinSurenchere();
  else if (snapAvisSession.roomCode) rejoinSnapAvis();
  else if (telepathieSession.roomCode) rejoinTelepathie();
}
</script>
