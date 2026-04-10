<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-lg font-bold text-stone-900">WikiRace</span>
        <span class="text-stone-300">·</span>
        <span class="text-sm text-stone-500">Salle d'attente</span>
      </div>
      <BaseButton variant="ghost" size="sm" @click="leaveRoom"> Quitter </BaseButton>
    </header>

    <div class="flex-1 max-w-4xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Left: room info + actions -->
      <div class="flex flex-col gap-5">
        <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-4">
          <RoomCodeDisplay :code="room.code" />
          <ShareLink :room-code="room.code" />
        </div>

        <!-- WAITING phase -->
        <template v-if="room.status === 'WAITING'">
          <!-- Host: launch button -->
          <div
            v-if="isHost"
            class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-4"
          >
            <h3 class="text-sm font-semibold text-stone-700">Paramètres</h3>
            <BaseButton
              size="lg"
              :disabled="room.players.length < 1"
              :loading="starting"
              class="w-full"
              @click="handleStart"
            >
              Lancer la partie →
            </BaseButton>
          </div>
          <!-- Guest: waiting for host -->
          <div
            v-else
            class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex items-center gap-3"
          >
            <LoadingSpinner size="sm" color="blue" />
            <span class="text-sm text-stone-500">En attente du host...</span>
          </div>
        </template>

        <!-- CHOOSING phase -->
        <template v-else-if="room.status === 'CHOOSING'">
          <!-- Chooser: pick mode + articles + options -->
          <div
            v-if="isChooser"
            class="bg-white rounded-2xl border border-amber-300 shadow-sm p-5 flex flex-col gap-5 overflow-y-auto max-h-[75vh]"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">🎲</span>
              <div>
                <h3 class="text-sm font-semibold text-stone-900">C'est à vous de choisir !</h3>
                <p class="text-xs text-stone-500">Vous avez été sélectionné·e au hasard</p>
              </div>
            </div>

            <!-- Mode selector -->
            <ModeSelector v-model="selectedMode" />

            <!-- Classic / Sprint: target article + time limit -->
            <template v-if="needsTarget">
              <TimeLimitSelector v-model="timeLimitSeconds" />
              <div class="flex flex-col gap-3">
                <WikiPageSearch label="Page de départ" @select="startPage = $event" />
                <WikiPageSearch label="Page d'arrivée" @select="targetPage = $event" />
                <p class="text-xs text-stone-400">Laisser vide = sélection aléatoire</p>
              </div>
            </template>

            <!-- Labyrinth: target + click limit -->
            <template v-else-if="selectedMode === 'LABYRINTH'">
              <ClickLimitSelector
                v-model="clickLimit"
                :options="[4, 5, 6]"
                label="Nombre de clics maximum"
              />
              <div class="flex flex-col gap-3">
                <WikiPageSearch label="Page de départ" @select="startPage = $event" />
                <WikiPageSearch label="Page d'arrivée" @select="targetPage = $event" />
                <p class="text-xs text-stone-400">Laisser vide = sélection aléatoire</p>
              </div>
            </template>

            <!-- WikiDrift: objective + click limit + start only -->
            <template v-else-if="selectedMode === 'DRIFT'">
              <DriftObjectiveSelector v-model="driftObjective" />
              <ClickLimitSelector
                v-model="clickLimit"
                :options="[5, 6, 8, 10]"
                label="Clics maximum par joueur"
              />
              <div class="flex flex-col gap-3">
                <WikiPageSearch label="Page de départ" @select="startPage = $event" />
                <p class="text-xs text-stone-400">Laisser vide = sélection aléatoire</p>
              </div>
            </template>

            <!-- Bingo: constraints + click limit + start only -->
            <template v-else-if="selectedMode === 'BINGO'">
              <BingoConstraintPicker v-model="selectedConstraints" />
              <ClickLimitSelector
                v-model="clickLimit"
                :options="[10, 15, 20]"
                label="Clics maximum par joueur"
              />
              <div class="flex flex-col gap-3">
                <WikiPageSearch label="Page de départ" @select="startPage = $event" />
                <p class="text-xs text-stone-400">Laisser vide = sélection aléatoire</p>
              </div>
            </template>

            <BaseButton
              size="lg"
              :loading="confirming"
              :disabled="!canConfirm"
              class="w-full"
              @click="handleConfirm"
            >
              Confirmer →
            </BaseButton>
          </div>
          <!-- Others: waiting for chooser -->
          <div
            v-else
            class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col items-center gap-3 py-8"
          >
            <span class="text-4xl">🎲</span>
            <p class="text-sm font-semibold text-stone-900">
              {{ room.chooserPseudo }} choisit les articles
            </p>
            <div class="flex items-center gap-2">
              <LoadingSpinner size="sm" color="blue" />
              <span class="text-xs text-stone-400">En attente...</span>
            </div>
          </div>
        </template>

        <ErrorToast :message="lobbyStore.error" />
      </div>

      <!-- Right: player list -->
      <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
        <PlayerList :players="room.players" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { GameMode, DriftObjective } from '@wiki-race/shared';
import type { BingoConstraintId } from '@wiki-race/shared';
import { useLobbyStore } from '../stores/useLobbyStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useGameSession } from '../composables/useGameSession';
import { useLobby } from '../composables/useLobby';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import LoadingSpinner from '@/shared/components/ui/LoadingSpinner.vue';
import ErrorToast from '@/shared/components/ui/ErrorToast.vue';
import RoomCodeDisplay from '../components/lobby/RoomCodeDisplay.vue';
import ShareLink from '../components/lobby/ShareLink.vue';
import PlayerList from '../components/lobby/PlayerList.vue';
import TimeLimitSelector from '../components/lobby/TimeLimitSelector.vue';
import WikiPageSearch from '../components/lobby/WikiPageSearch.vue';
import ModeSelector from '../components/lobby/ModeSelector.vue';
import ClickLimitSelector from '../components/lobby/ClickLimitSelector.vue';
import DriftObjectiveSelector from '../components/lobby/DriftObjectiveSelector.vue';
import BingoConstraintPicker from '../components/lobby/BingoConstraintPicker.vue';

const lobbyStore = useLobbyStore();
const sessionStore = useSessionStore();
const { startGame, confirmChoices } = useGameSession();
const { leaveRoom } = useLobby();

const starting = ref(false);
const confirming = ref(false);

// Mode state
const selectedMode = ref<GameMode>(GameMode.CLASSIC);
const timeLimitSeconds = ref<number | null>(null);
const clickLimit = ref<number>(6);
const driftObjective = ref<DriftObjective>(DriftObjective.OLDEST_TITLE_YEAR);
const selectedConstraints = ref<BingoConstraintId[]>([]);

interface WikiResult {
  slug: string;
  title: string;
}
const startPage = ref<WikiResult | null>(null);
const targetPage = ref<WikiResult | null>(null);

const room = computed(() => lobbyStore.room!);
const isHost = computed(() => room.value?.hostPseudo === sessionStore.pseudo);
const isChooser = computed(() => room.value?.chooserPseudo === sessionStore.pseudo);

const needsTarget = computed(
  () => selectedMode.value === GameMode.CLASSIC || selectedMode.value === GameMode.SPRINT,
);

const canConfirm = computed(() => {
  if (selectedMode.value === GameMode.SPRINT && !timeLimitSeconds.value) return false;
  if (selectedMode.value === GameMode.BINGO) {
    return selectedConstraints.value.length >= 4 && selectedConstraints.value.length <= 6;
  }
  return true;
});

function handleStart() {
  starting.value = true;
  startGame();
}

function handleConfirm() {
  confirming.value = true;
  const mode = selectedMode.value;

  if (mode === GameMode.CLASSIC || mode === GameMode.SPRINT) {
    confirmChoices(mode, timeLimitSeconds.value, {
      startSlug: startPage.value?.slug,
      targetSlug: targetPage.value?.slug,
    });
  } else if (mode === GameMode.LABYRINTH) {
    confirmChoices(mode, null, {
      clickLimit: clickLimit.value,
      startSlug: startPage.value?.slug,
      targetSlug: targetPage.value?.slug,
    });
  } else if (mode === GameMode.DRIFT) {
    confirmChoices(mode, null, {
      clickLimit: clickLimit.value,
      startSlug: startPage.value?.slug,
      driftObjective: driftObjective.value,
    });
  } else if (mode === GameMode.BINGO) {
    confirmChoices(mode, null, {
      clickLimit: clickLimit.value,
      startSlug: startPage.value?.slug,
      bingoConstraintIds: selectedConstraints.value,
    });
  }
}
</script>
