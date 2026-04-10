<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-lg font-bold text-stone-900">WikiRace</span>
        <span class="text-stone-300">·</span>
        <span class="text-sm text-stone-500">Salle d'attente</span>
      </div>
      <BaseButton
        variant="ghost"
        size="sm"
        @click="leaveRoom"
      >
        Quitter
      </BaseButton>
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
          <!-- Host: just a launch button -->
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
          <!-- Chooser: pick articles + time limit -->
          <div
            v-if="isChooser"
            class="bg-white rounded-2xl border border-amber-300 shadow-sm p-5 flex flex-col gap-5"
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
            <BaseButton
              size="lg"
              :loading="confirming"
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
              <LoadingSpinner
                size="sm"
                color="blue"
              />
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

const lobbyStore = useLobbyStore();
const sessionStore = useSessionStore();
const { startGame, confirmChoices } = useGameSession();
const { leaveRoom } = useLobby();

const starting = ref(false);
const confirming = ref(false);
const timeLimitSeconds = ref<number | null>(null);

interface WikiResult { slug: string; title: string }
const startPage = ref<WikiResult | null>(null);
const targetPage = ref<WikiResult | null>(null);

const room = computed(() => lobbyStore.room!);
const isHost = computed(() => room.value?.hostPseudo === sessionStore.pseudo);
const isChooser = computed(() => room.value?.chooserPseudo === sessionStore.pseudo);

function handleStart() {
  starting.value = true;
  startGame();
}

function handleConfirm() {
  confirming.value = true;
  confirmChoices(timeLimitSeconds.value, startPage.value?.slug, targetPage.value?.slug);
}
</script>
