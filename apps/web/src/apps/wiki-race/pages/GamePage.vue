<template>
  <div class="h-screen bg-stone-50 flex flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="shrink-0 bg-white border-b border-stone-200 px-4 py-2 flex items-center justify-between gap-4">
      <TargetPageDisplay :target-slug="gameStore.targetSlug" />

      <GameTimer
        v-if="gameStore.gameState"
        :start-time="gameStore.gameState.startTime"
        :time-limit-seconds="gameStore.gameState.timeLimitSeconds"
      />

      <div class="flex items-center gap-2">
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
import TargetPageDisplay from '../components/game/TargetPageDisplay.vue';
import PlayerSidebar from '../components/game/PlayerSidebar.vue';
import NavigationHistory from '../components/game/NavigationHistory.vue';
import SurrenderButton from '../components/game/SurrenderButton.vue';

const gameStore = useGameStore();
const sessionStore = useSessionStore();
const { navigate, surrender } = useGameSession();

const myHistory = computed(() => gameStore.localHistory);
</script>
