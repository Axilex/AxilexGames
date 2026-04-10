<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-lg font-bold text-stone-900">WikiRace</span>
        <span class="text-stone-300">·</span>
        <span class="text-sm text-stone-500">Salle d'attente</span>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="ghost"
          size="sm"
          @click="leaveRoom"
        >
          Quitter
        </BaseButton>
      </div>
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
            <h3 class="text-sm font-semibold text-stone-700">
              Paramètres
            </h3>
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
            <LoadingSpinner
              size="sm"
              color="blue"
            />
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
                <h3 class="text-sm font-semibold text-stone-900">
                  C'est à vous de choisir !
                </h3>
                <p class="text-xs text-stone-500">
                  Vous avez été sélectionné·e au hasard
                </p>
              </div>
            </div>

            <!-- Mode selector -->
            <ModeSelector v-model="selectedMode" />

            <!-- Classic / Sprint: target article + time limit -->
            <template v-if="needsTarget">
              <TimeLimitSelector v-model="timeLimitSeconds" />
              <div class="flex flex-col gap-3">
                <WikiPageSearch
                  label="Page de départ"
                  @select="startPage = $event"
                />
                <WikiPageSearch
                  label="Page d'arrivée"
                  @select="targetPage = $event"
                />
                <p class="text-xs text-stone-400">
                  Laisser vide = sélection aléatoire
                </p>
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
                <WikiPageSearch
                  label="Page de départ"
                  @select="startPage = $event"
                />
                <WikiPageSearch
                  label="Page d'arrivée"
                  @select="targetPage = $event"
                />
                <p class="text-xs text-stone-400">
                  Laisser vide = sélection aléatoire
                </p>
              </div>
            </template>

            <!-- WikiDrift: objective + click limit + start only -->
            <template v-else-if="selectedMode === 'DRIFT'">
              <DriftObjectiveSelector v-model="driftObjective" />
              <ClickLimitSelector
                v-model="clickLimit"
                :options="[5, 6, 8, 10]"
                :allow-infinite="true"
                label="Clics maximum par joueur"
              />
              <div class="flex flex-col gap-3">
                <WikiPageSearch
                  label="Page de départ"
                  @select="startPage = $event"
                />
                <p class="text-xs text-stone-400">
                  Laisser vide = sélection aléatoire
                </p>
              </div>
            </template>

            <!-- Bingo: constraints + click limit + start only -->
            <template v-else-if="selectedMode === 'BINGO'">
              <BingoConstraintPicker v-model="selectedConstraints" />
              <ClickLimitSelector
                v-model="clickLimit"
                :options="[10, 15, 20]"
                :allow-infinite="true"
                label="Clics maximum par joueur"
              />
              <div class="flex flex-col gap-3">
                <WikiPageSearch
                  label="Page de départ"
                  @select="startPage = $event"
                />
                <p class="text-xs text-stone-400">
                  Laisser vide = sélection aléatoire
                </p>
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
          <!-- Others: live preview of chooser selections -->
          <div
            v-else
            class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-lg">🎲</span>
              <div>
                <p class="text-sm font-semibold text-stone-900">
                  {{ room.chooserPseudo }} choisit…
                </p>
                <p class="text-xs text-stone-400">
                  Aperçu en direct
                </p>
              </div>
              <LoadingSpinner
                size="sm"
                color="blue"
                class="ml-auto"
              />
            </div>

            <!-- Preview card, appears once chooser starts selecting -->
            <template v-if="lobbyStore.choosingPreview">
              <!-- Mode -->
              <div class="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                <span class="text-lg">{{ modeIcon(lobbyStore.choosingPreview.mode) }}</span>
                <div>
                  <div class="text-xs font-semibold text-stone-700">
                    {{ modeLabel(lobbyStore.choosingPreview.mode) }}
                  </div>
                  <div class="text-xs text-stone-400">
                    {{ modeDescription(lobbyStore.choosingPreview.mode) }}
                  </div>
                </div>
              </div>

              <!-- Articles -->
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-14 text-stone-400 shrink-0">Départ</span>
                  <span class="font-medium text-stone-700 truncate">
                    {{ lobbyStore.choosingPreview.startTitle ?? '— aléatoire' }}
                  </span>
                </div>
                <div
                  v-if="lobbyStore.choosingPreview.mode === 'CLASSIC' || lobbyStore.choosingPreview.mode === 'SPRINT' || lobbyStore.choosingPreview.mode === 'LABYRINTH'"
                  class="flex items-center gap-2 text-xs"
                >
                  <span class="w-14 text-stone-400 shrink-0">Arrivée</span>
                  <span class="font-medium text-stone-700 truncate">
                    {{ lobbyStore.choosingPreview.targetTitle ?? '— aléatoire' }}
                  </span>
                </div>
              </div>

              <!-- CLASSIC / SPRINT: timer -->
              <template
                v-if="lobbyStore.choosingPreview.mode === 'CLASSIC' || lobbyStore.choosingPreview.mode === 'SPRINT'"
              >
                <div class="flex flex-wrap gap-2">
                  <span
                    v-if="lobbyStore.choosingPreview.timeLimitSeconds"
                    class="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700"
                  >
                    ⏱ {{ lobbyStore.choosingPreview.timeLimitSeconds / 60 }} min
                  </span>
                  <span
                    v-else-if="lobbyStore.choosingPreview.mode === 'CLASSIC'"
                    class="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs text-stone-400"
                  >
                    ⏱ Sans limite
                  </span>
                </div>
              </template>

              <!-- LABYRINTH / DRIFT / BINGO: clics -->
              <template
                v-else-if="lobbyStore.choosingPreview.mode === 'LABYRINTH' || lobbyStore.choosingPreview.mode === 'DRIFT' || lobbyStore.choosingPreview.mode === 'BINGO'"
              >
                <div class="flex flex-wrap gap-2">
                  <span
                    v-if="lobbyStore.choosingPreview.clickLimit !== null && lobbyStore.choosingPreview.clickLimit !== undefined"
                    class="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                  >
                    🖱 {{ lobbyStore.choosingPreview.clickLimit }} clics
                  </span>
                  <span
                    v-else-if="lobbyStore.choosingPreview.clickLimit === null"
                    class="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                  >
                    🖱 ∞ Illimité
                  </span>
                  <!-- DRIFT: objectif -->
                  <span
                    v-if="lobbyStore.choosingPreview.mode === 'DRIFT' && lobbyStore.choosingPreview.driftObjective"
                    class="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                  >
                    {{ driftObjectiveLabel(lobbyStore.choosingPreview.driftObjective) }}
                  </span>
                </div>
                <!-- BINGO: contraintes -->
                <div
                  v-if="lobbyStore.choosingPreview.mode === 'BINGO' && lobbyStore.choosingPreview.bingoConstraintIds?.length"
                  class="flex flex-col gap-1"
                >
                  <span class="text-xs text-stone-400">
                    Contraintes ({{ lobbyStore.choosingPreview.bingoConstraintIds.length }}/4–6)
                  </span>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="id in lobbyStore.choosingPreview.bingoConstraintIds"
                      :key="id"
                      class="inline-flex items-center rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-xs text-stone-600"
                    >
                      {{ constraintLabel(id) }}
                    </span>
                  </div>
                </div>
              </template>
            </template>

            <!-- Placeholder before any preview arrives -->
            <div
              v-else
              class="text-xs text-stone-400 text-center py-2"
            >
              En attente des premières sélections…
            </div>
          </div>
        </template>

        <ErrorToast :message="lobbyStore.error" />
      </div>

      <!-- Right: player list + rules card -->
      <div class="flex flex-col gap-4">
        <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
          <PlayerList :players="room.players" />
        </div>
        <RulesCard />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { GameMode, DriftObjective, BINGO_CONSTRAINTS } from '@wiki-race/shared';
import type { BingoConstraintId } from '@wiki-race/shared';
import { useLobbyStore } from '../stores/useLobbyStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import { useGameSession } from '../composables/useGameSession';
import { useLobby } from '../composables/useLobby';
import { gameService } from '../services/game.service';
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
import RulesCard from '../components/RulesCard.vue';

const lobbyStore = useLobbyStore();
const sessionStore = useSessionStore();
const { startGame, confirmChoices } = useGameSession();
const { leaveRoom } = useLobby();
const starting = ref(false);
const confirming = ref(false);

// Mode state
const selectedMode = ref<GameMode>(GameMode.CLASSIC);
const timeLimitSeconds = ref<number | null>(null);
const clickLimit = ref<number | null>(6);
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

// Emit live preview to other players whenever the chooser changes a selection
function emitPreview() {
  if (!isChooser.value || !room.value) return;
  const mode = selectedMode.value;
  const payload: import('@wiki-race/shared').ChoosingPreviewPayload = {
    roomCode: room.value.code,
    mode,
    startTitle: startPage.value?.title,
  };
  if (mode === GameMode.CLASSIC || mode === GameMode.SPRINT) {
    payload.targetTitle = targetPage.value?.title;
    payload.timeLimitSeconds = timeLimitSeconds.value;
  } else if (mode === GameMode.LABYRINTH) {
    payload.targetTitle = targetPage.value?.title;
    payload.clickLimit = clickLimit.value;
  } else if (mode === GameMode.DRIFT) {
    payload.clickLimit = clickLimit.value;
    payload.driftObjective = driftObjective.value;
  } else if (mode === GameMode.BINGO) {
    payload.clickLimit = clickLimit.value;
    payload.bingoConstraintIds = selectedConstraints.value;
  }
  gameService.previewChoices(payload);
}

// Fire immediately when this player becomes the chooser (covers initial state + transition from WAITING)
watch(isChooser, (val) => { if (val) emitPreview(); }, { immediate: true });

// Re-emit whenever any option changes
watch(
  [selectedMode, timeLimitSeconds, clickLimit, driftObjective, selectedConstraints, startPage, targetPage],
  emitPreview,
  { deep: true },
);

// Helper functions for the non-chooser preview panel
const MODE_META: Record<GameMode, { icon: string; label: string; description: string }> = {
  [GameMode.CLASSIC]: {
    icon: '🏁',
    label: 'Classique',
    description: 'Premier à atteindre la page cible gagne.',
  },
  [GameMode.SPRINT]: {
    icon: '⚡',
    label: 'Sprint',
    description: 'Même but, mais avec un timer court.',
  },
  [GameMode.LABYRINTH]: {
    icon: '🧩',
    label: 'Labyrinthe',
    description: 'Nombre de clics limité. Réfléchissez avant de cliquer !',
  },
  [GameMode.DRIFT]: {
    icon: '🌊',
    label: 'WikiDrift',
    description: 'Explorez Wikipedia selon un objectif secret.',
  },
  [GameMode.BINGO]: {
    icon: '🎯',
    label: 'Bingo Wiki',
    description: 'Validez des contraintes en visitant des pages.',
  },
};

function modeIcon(mode: GameMode): string {
  return MODE_META[mode]?.icon ?? '🎮';
}
function modeLabel(mode: GameMode): string {
  return MODE_META[mode]?.label ?? mode;
}
function modeDescription(mode: GameMode): string {
  return MODE_META[mode]?.description ?? '';
}
function driftObjectiveLabel(obj: DriftObjective): string {
  if (obj === DriftObjective.OLDEST_TITLE_YEAR) return '📜 Plus ancienne';
  if (obj === DriftObjective.SHORTEST) return '📄 Plus courte';
  return '🖼 Plus d\'images';
}
function constraintLabel(id: BingoConstraintId): string {
  return BINGO_CONSTRAINTS.find((c) => c.id === id)?.label ?? id;
}
</script>
