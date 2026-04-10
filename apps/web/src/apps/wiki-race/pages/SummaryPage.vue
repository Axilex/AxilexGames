<template>
  <div class="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
    <div class="w-full max-w-2xl flex flex-col gap-6">
      <WinnerBanner v-if="summary" :summary="summary" />

      <!-- DRIFT: ranked leaderboard -->
      <div
        v-if="summary?.mode === 'DRIFT'"
        class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6"
      >
        <DriftLeaderboard :summary="summary" />
      </div>

      <!-- BINGO: bingo board summary -->
      <div
        v-else-if="summary?.mode === 'BINGO'"
        class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6"
      >
        <BingoBoardSummary :summary="summary" />
      </div>

      <!-- CLASSIC / SPRINT / LABYRINTH: player paths -->
      <div
        v-else
        class="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-col gap-5"
      >
        <h3 class="text-sm font-semibold text-stone-500 uppercase tracking-widest">Parcours</h3>
        <PlayerPathDisplay
          v-for="player in summary?.players"
          :key="player.pseudo"
          :pseudo="player.pseudo"
          :is-winner="player.isWinner"
          :surrendered="player.surrendered"
          :hop-count="player.hopCount"
          :path="player.path"
          :start-slug="summary?.startSlug ?? ''"
          :target-slug="summary?.targetSlug ?? ''"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-center">
        <BaseButton variant="secondary" @click="goHome"> Accueil </BaseButton>
        <BaseButton v-if="isHost" @click="playAgain"> Rejouer dans cette room → </BaseButton>
        <BaseButton v-else variant="secondary" @click="goToLobby"> Retour au lobby </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/useGameStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useLobbyStore } from '../stores/useLobbyStore';
import { lobbyService } from '../services/lobby.service';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import WinnerBanner from '../components/summary/WinnerBanner.vue';
import PlayerPathDisplay from '../components/summary/PlayerPathDisplay.vue';
import DriftLeaderboard from '../components/summary/DriftLeaderboard.vue';
import BingoBoardSummary from '../components/summary/BingoBoardSummary.vue';

const router = useRouter();
const gameStore = useGameStore();
const sessionStore = useSessionStore();
const lobbyStore = useLobbyStore();

const summary = computed(() => gameStore.summary);
const isHost = computed(() => lobbyStore.room?.hostPseudo === sessionStore.pseudo);

function goHome() {
  gameStore.reset();
  sessionStore.clearSession();
  lobbyStore.reset();
  router.push({ name: 'wikirace' });
}

function playAgain() {
  const roomCode = sessionStore.roomCode;
  gameStore.reset();
  if (roomCode) lobbyService.resetRoom(roomCode);
  router.push({ name: 'lobby' });
}

function goToLobby() {
  router.push({ name: 'lobby' });
}
</script>
