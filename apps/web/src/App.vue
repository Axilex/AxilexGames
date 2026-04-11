<template>
  <router-view />
  <DisconnectOverlay :on-reconnect="doRejoin" />
</template>

<script setup lang="ts">
import { socketService } from '@/shared/services/socket.service';
import { useSocketListeners } from '@/apps/wiki-race/composables/useSocketListeners';
import { useSurenchereListeners } from '@/apps/surenchere/composables/useSurenchereListeners';
import { useReconnection } from '@/shared/composables/useReconnection';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { lobbyService } from '@/apps/wiki-race/services/lobby.service';
import { surenchereSocket } from '@/apps/surenchere/services/surenchere.service';
import DisconnectOverlay from '@/shared/components/ui/DisconnectOverlay.vue';

// Connect first so the socket object exists before listeners are registered
socketService.connect();
useSocketListeners();
useSurenchereListeners();

const wikiSession = useSessionStore();
const surenchereSession = useSurenchereSessionStore();

// One reconnection watcher per game — whichever session has an active roomCode drives the rejoin.
const { doRejoin: rejoinWiki } = useReconnection(
  () => ({ pseudo: wikiSession.pseudo, roomCode: wikiSession.roomCode }),
  (roomCode, pseudo) => lobbyService.joinRoom(roomCode, pseudo),
);
const { doRejoin: rejoinSurenchere } = useReconnection(
  () => ({ pseudo: surenchereSession.pseudo, roomCode: surenchereSession.roomCode }),
  (roomCode, pseudo) => surenchereSocket.join(roomCode, pseudo),
);

function doRejoin(): void {
  if (wikiSession.roomCode) rejoinWiki();
  else if (surenchereSession.roomCode) rejoinSurenchere();
}
</script>
