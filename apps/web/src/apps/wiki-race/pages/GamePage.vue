<template>
  <div class="h-screen bg-stone-50 flex flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="shrink-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-4">
      <!-- Départ + Arrivée — centré, prend tout l'espace disponible -->
      <div class="flex-1 flex items-center justify-center gap-3 min-w-0">
        <!-- Départ -->
        <div class="flex flex-col items-center min-w-0">
          <span class="text-[10px] font-semibold text-stone-400 uppercase tracking-widest leading-none mb-0.5">Départ</span>
          <span class="text-lg font-bold text-stone-900 leading-tight truncate max-w-[220px]">
            {{ decodeURIComponent(gameStore.startSlug).replace(/_/g, ' ') }}
          </span>
        </div>

        <!-- Flèche -->
        <svg
          class="shrink-0 h-5 w-5 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>

        <!-- Arrivée -->
        <div class="flex flex-col items-center min-w-0">
          <span class="text-[10px] font-semibold text-amber-500 uppercase tracking-widest leading-none mb-0.5">Arrivée</span>
          <span class="text-lg font-bold text-amber-700 leading-tight truncate max-w-[220px]">
            {{ decodeURIComponent(gameStore.targetSlug).replace(/_/g, ' ') }}
          </span>
        </div>
      </div>

      <!-- Timer + actions — à droite -->
      <div class="shrink-0 flex items-center gap-2">
        <GameTimer
          v-if="gameStore.gameState"
          :start-time="gameStore.gameState.startTime"
          :time-limit-seconds="gameStore.gameState.timeLimitSeconds"
        />
        <ErrorToast :message="gameStore.navigationError" />
        <SurrenderButton @surrender="surrender" />
      </div>
    </header>

    <!-- Main layout -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Wikipedia content (main area) -->
      <main class="flex-1 overflow-hidden bg-white border-r border-stone-200">
        <div
          v-if="!gameStore.currentPage"
          class="h-full flex items-center justify-center"
        >
          <LoadingSpinner
            size="lg"
            color="blue"
          />
        </div>
        <WikiContentArea
          v-else
          :html-content="gameStore.currentPage.htmlContent"
          :title="gameStore.currentPage.title"
          :is-navigating="gameStore.isNavigating"
          @navigate="navigate"
        />
      </main>

      <!-- Right sidebar: players + history -->
      <aside class="w-60 shrink-0 flex flex-col overflow-hidden bg-stone-50">
        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          <PlayerSidebar
            v-if="gameStore.gameState"
            :players="gameStore.gameState.playerStatuses"
            :current-pseudo="sessionStore.pseudo"
          />
          <div class="border-t border-stone-200 pt-4">
            <NavigationHistory
              v-if="gameStore.gameState"
              :history="myHistory"
              :start-slug="gameStore.startSlug"
            />
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../stores/useGameStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useGameSession } from '../composables/useGameSession';
import LoadingSpinner from '@/shared/components/ui/LoadingSpinner.vue';
import ErrorToast from '@/shared/components/ui/ErrorToast.vue';
import WikiContentArea from '../components/game/WikiContentArea.vue';
import GameTimer from '../components/game/GameTimer.vue';
import PlayerSidebar from '../components/game/PlayerSidebar.vue';
import NavigationHistory from '../components/game/NavigationHistory.vue';
import SurrenderButton from '../components/game/SurrenderButton.vue';

const gameStore = useGameStore();
const sessionStore = useSessionStore();
const { navigate, surrender } = useGameSession();

const myHistory = computed(() => gameStore.localHistory);
</script>
