<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-stone-900">🏆 Surenchère — Fin de partie</h1>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
      <Podium :ranked="store.finalRanking" />
      <FullScoreboard :ranked="store.finalRanking" />

      <div class="flex gap-3 justify-center flex-wrap">
        <BaseButton v-if="store.isHost" @click="onReplay">Rejouer</BaseButton>
        <BaseButton v-if="commonSession.roomCode" variant="secondary" @click="onReturnToLobby">
          ↩ Retour au lobby commun
        </BaseButton>
        <BaseButton variant="secondary" @click="onLeave">Quitter</BaseButton>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import Podium from '../components/summary/Podium.vue';
import FullScoreboard from '../components/summary/FullScoreboard.vue';
import { useSurenchereStore } from '../stores/useSurenchereStore';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';
import { useCommonLobbyStore } from '@/apps/common-lobby/stores/useCommonLobbyStore';
import { surenchereSocket } from '../services/surenchere.service';
import { lobbySocket } from '@/apps/common-lobby/services/lobby.service';

const router = useRouter();
const store = useSurenchereStore();
const session = useSurenchereSessionStore();
const commonSession = useCommonSessionStore();
const commonLobbyStore = useCommonLobbyStore();

function onReplay(): void {
  surenchereSocket.reset();
  router.push({ name: 'surenchere-lobby' });
}

function onReturnToLobby(): void {
  const code = commonSession.roomCode;
  session.clearSession();
  store.reset();
  router.push({ name: 'common-lobby', params: { code } });
}

function onLeave(): void {
  surenchereSocket.leave();
  if (commonSession.roomCode) {
    lobbySocket.leave();
    commonSession.clearSession();
    commonLobbyStore.reset();
  }
  session.clearSession();
  store.reset();
  router.push({ name: 'home' });
}
</script>
