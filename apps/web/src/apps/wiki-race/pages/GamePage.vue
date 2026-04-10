<template>
  <div class="h-screen bg-stone-50 flex flex-col overflow-hidden">
    <!-- Top bar -->
    <header class="shrink-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-4">
      <!-- Mode-specific header content -->
      <div class="flex-1 flex items-center justify-center gap-3 min-w-0">
        <!-- CLASSIC / SPRINT / LABYRINTH: Départ → Arrivée -->
        <template
          v-if="
            gameStore.mode === 'CLASSIC' ||
              gameStore.mode === 'SPRINT' ||
              gameStore.mode === 'LABYRINTH'
          "
        >
          <div class="flex flex-col items-center min-w-0">
            <span
              class="text-[10px] font-semibold text-stone-400 uppercase tracking-widest leading-none mb-0.5"
            >Départ</span>
            <span class="text-lg font-bold text-stone-900 leading-tight truncate max-w-[180px]">
              {{ decodeURIComponent(gameStore.startSlug).replace(/_/g, ' ') }}
            </span>
          </div>
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
          <div class="flex flex-col items-center min-w-0">
            <span
              class="text-[10px] font-semibold text-amber-500 uppercase tracking-widest leading-none mb-0.5"
            >Arrivée</span>
            <span class="text-lg font-bold text-amber-700 leading-tight truncate max-w-[180px]">
              {{
                gameStore.targetSlug
                  ? decodeURIComponent(gameStore.targetSlug).replace(/_/g, ' ')
                  : '—'
              }}
            </span>
          </div>
          <!-- Clicks left badge for Labyrinth -->
          <div
            v-if="gameStore.mode === 'LABYRINTH' && myPlayer && myPlayer.clicksLeft !== null"
            class="ml-2 px-2.5 py-1 rounded-full text-xs font-bold"
            :class="
              myPlayer.clicksLeft <= 1
                ? 'bg-red-100 text-red-700'
                : myPlayer.clicksLeft <= 2
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-stone-600'
            "
          >
            {{ myPlayer.clicksLeft }} clic{{ myPlayer.clicksLeft !== 1 ? 's' : '' }}
          </div>
        </template>

        <!-- DRIFT: objectif + meilleur score -->
        <template v-else-if="gameStore.mode === 'DRIFT'">
          <div class="flex flex-col items-center min-w-0">
            <span
              class="text-[10px] font-semibold text-stone-400 uppercase tracking-widest leading-none mb-0.5"
            >Départ</span>
            <span class="text-base font-bold text-stone-900 truncate max-w-[140px]">
              {{ decodeURIComponent(gameStore.startSlug).replace(/_/g, ' ') }}
            </span>
          </div>
          <svg
            class="shrink-0 h-5 w-5 text-stone-300"
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
          <div class="flex flex-col items-center min-w-0">
            <span
              class="text-[10px] font-semibold text-amber-500 uppercase tracking-widest leading-none mb-0.5"
            >Objectif</span>
            <span class="text-base font-bold text-amber-700">{{ driftObjectiveLabel }}</span>
          </div>
          <div
            v-if="myPlayer && myPlayer.driftBestScore !== null"
            class="ml-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-amber-700"
          >
            {{ formatDriftScore(myPlayer.driftBestScore) }}
          </div>
        </template>

        <!-- BINGO: progress bar -->
        <template v-else-if="gameStore.mode === 'BINGO'">
          <div class="flex flex-col items-center min-w-0">
            <span
              class="text-[10px] font-semibold text-stone-400 uppercase tracking-widest leading-none mb-0.5"
            >Départ</span>
            <span class="text-base font-bold text-stone-900 truncate max-w-[140px]">
              {{ decodeURIComponent(gameStore.startSlug).replace(/_/g, ' ') }}
            </span>
          </div>
          <div class="ml-4 flex flex-col items-center gap-1">
            <span class="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">
              Bingo — {{ myValidatedCount }}/{{ totalConstraints }} contraintes
            </span>
            <div class="flex gap-1">
              <span
                v-for="i in totalConstraints"
                :key="i"
                class="h-2 w-6 rounded-full transition-colors"
                :class="i <= myValidatedCount ? 'bg-amber-500' : 'bg-stone-200'"
              />
            </div>
          </div>
        </template>
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

      <!-- Right sidebar: players + mode info + history -->
      <aside class="w-60 shrink-0 flex flex-col overflow-hidden bg-stone-50">
        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          <PlayerSidebar
            v-if="gameStore.gameState"
            :players="gameStore.gameState.playerStatuses"
            :current-pseudo="sessionStore.pseudo"
            :mode="gameStore.mode"
          />

          <!-- Bingo card for current player -->
          <BingoCard
            v-if="gameStore.mode === 'BINGO' && gameStore.bingoConstraints"
            :constraint-ids="gameStore.bingoConstraints"
            :validated="myPlayer?.bingoValidated ?? []"
            :recently-validated="gameStore.recentlyValidatedBingo"
          />

          <!-- Drift score for current player -->
          <DriftScoreDisplay
            v-if="gameStore.mode === 'DRIFT' && gameStore.driftObjective && myPlayer"
            :objective="gameStore.driftObjective"
            :best-score="myPlayer.driftBestScore"
            :best-slug="myPlayer.driftBestSlug"
          />

          <div class="border-t border-stone-200 pt-4">
            <NavigationHistory
              v-if="gameStore.gameState"
              :history="myHistory"
              :start-slug="gameStore.startSlug"
            />
          </div>

          <RulesCard />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DriftObjective } from '@wiki-race/shared';
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
import BingoCard from '../components/game/BingoCard.vue';
import DriftScoreDisplay from '../components/game/DriftScoreDisplay.vue';
import RulesCard from '../components/RulesCard.vue';

const gameStore = useGameStore();
const sessionStore = useSessionStore();
const { navigate, surrender } = useGameSession();

const myHistory = computed(() => gameStore.localHistory);

const myPlayer = computed(
  () => gameStore.gameState?.playerStatuses.find((p) => p.pseudo === sessionStore.pseudo) ?? null,
);

const myValidatedCount = computed(() => myPlayer.value?.bingoValidated?.length ?? 0);
const totalConstraints = computed(() => gameStore.bingoConstraints?.length ?? 0);

const driftObjectiveLabel = computed(() => {
  const labels: Record<DriftObjective, string> = {
    [DriftObjective.OLDEST_TITLE_YEAR]: 'Page la plus ancienne',
    [DriftObjective.SHORTEST]: 'Page la plus courte',
    [DriftObjective.MOST_IMAGES]: "Plus d'images",
  };
  return gameStore.driftObjective ? labels[gameStore.driftObjective] : '';
});

function formatDriftScore(score: number): string {
  if (!gameStore.driftObjective) return String(score);
  if (gameStore.driftObjective === DriftObjective.OLDEST_TITLE_YEAR)
    return score === 9999 ? '—' : String(score);
  if (gameStore.driftObjective === DriftObjective.SHORTEST) return `${score} mots`;
  if (gameStore.driftObjective === DriftObjective.MOST_IMAGES) return `${score} imgs`;
  return String(score);
}
</script>
