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
      <!-- Left: room info + settings -->
      <div class="flex flex-col gap-5">
        <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-4">
          <RoomCodeDisplay :code="room.code" />
          <ShareLink :room-code="room.code" />
        </div>

        <div
          v-if="isHost"
          class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col gap-5"
        >
          <h3 class="text-sm font-semibold text-stone-700">
            Paramètres de la partie
          </h3>
          <TimeLimitSelector v-model="timeLimitSeconds" />
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-1.5 text-xs text-stone-400">
              <svg
                class="h-3.5 w-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Visible uniquement par vous
            </div>
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
            :disabled="room.players.length < 1"
            :loading="starting"
            class="w-full"
            @click="handleStart"
          >
            Lancer la partie →
          </BaseButton>
        </div>

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
const { startGame } = useGameSession();
const { leaveRoom } = useLobby();

const timeLimitSeconds = ref<number | null>(null);
const starting = ref(false);

interface WikiResult { slug: string; title: string }
const startPage = ref<WikiResult | null>(null);
const targetPage = ref<WikiResult | null>(null);

const room = computed(() => lobbyStore.room!);
const isHost = computed(() => room.value?.hostPseudo === sessionStore.pseudo);

function handleStart() {
  starting.value = true;
  startGame(timeLimitSeconds.value, startPage.value?.slug, targetPage.value?.slug);
}
</script>
