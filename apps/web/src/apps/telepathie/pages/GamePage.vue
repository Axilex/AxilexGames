<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-stone-900">🔄 Télépathie</span>
          <span class="text-stone-300">·</span>
          <span class="text-xs text-stone-500">
            Manche {{ store.room?.currentManche ?? 1 }}/{{ store.room?.settings.totalManches ?? 5 }}
          </span>
          <template v-if="store.phase === 'PLAYING' || store.phase === 'ROUND_RESULT'">
            <span class="text-stone-300">·</span>
            <span class="text-xs text-stone-400">
              SR {{ store.room?.currentSousRound ?? 1 }}/{{
                store.room?.settings.maxSousRounds ?? 10
              }}
            </span>
          </template>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-teal-600 tabular-nums">
            {{ store.myScore }} pts
          </span>
          <button
            class="text-xs text-stone-400 hover:text-stone-700 transition"
            @click="showScores = !showScores"
          >
            🏆 Scores
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
      <!-- Panel scores -->
      <div
        v-if="showScores"
        class="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col gap-2"
      >
        <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">Classement</p>
        <div
          v-for="player in sortedPlayers"
          :key="player.socketId"
          :class="[
            'flex items-center justify-between text-sm',
            player.socketId === store.mySocketId ? 'font-bold text-teal-700' : 'text-stone-700',
          ]"
        >
          <span>{{ player.pseudo }}</span>
          <span class="tabular-nums font-bold">{{ player.score }}</span>
        </div>
      </div>

      <!-- ── PHASE: CHOOSING ── -->
      <template v-if="store.phase === 'CHOOSING'">
        <div
          class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-3 text-center"
        >
          <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Manche {{ store.room?.currentManche ?? 1 }} — Choisissez votre mot de départ
          </p>
          <p class="text-sm text-stone-500">
            Entrez un mot que les autres joueurs devront deviner pour vous rejoindre.
          </p>
        </div>

        <!-- Timer -->
        <TimerBar v-if="store.inputEndsAt" :ends-at="store.inputEndsAt" :total-ms="30 * 1000" />

        <!-- Saisie du mot de départ -->
        <WordInput :disabled="store.hasChosen" button-label="Choisir →" @submit="onChooseWord" />

        <!-- Qui a déjà choisi -->
        <div class="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col gap-2">
          <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">En attente</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="player in store.room?.players ?? []"
              :key="player.socketId"
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold border transition',
                player.currentWord !== null
                  ? 'bg-teal-100 border-teal-300 text-teal-800'
                  : 'bg-stone-100 border-stone-200 text-stone-500',
              ]"
            >
              {{ player.pseudo }} {{ player.currentWord !== null ? '✓' : '…' }}
            </span>
          </div>
        </div>
      </template>

      <!-- ── PHASE: PLAYING ── -->
      <template v-if="store.phase === 'PLAYING'">
        <!-- Mot courant -->
        <div
          class="bg-white rounded-2xl border border-stone-200 p-5 text-center flex flex-col gap-2"
        >
          <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Ton mot actuel
          </p>
          <p class="text-3xl font-extrabold text-teal-700 tracking-tight">
            {{ store.myWord ?? '—' }}
          </p>
        </div>

        <!-- Timer -->
        <TimerBar
          v-if="store.inputEndsAt"
          :ends-at="store.inputEndsAt"
          :total-ms="(store.room?.settings.roundTimerSeconds ?? 30) * 1000"
        />

        <!-- Mots des autres joueurs -->
        <CurrentWords :players="store.room?.players ?? []" :my-socket-id="store.mySocketId" />

        <!-- Erreur mot dupliqué -->
        <p
          v-if="duplicateError"
          class="text-xs text-red-500 font-medium text-center bg-red-50 border border-red-200 rounded-xl px-3 py-2"
        >
          Tu as déjà utilisé ce mot dans cette manche. Essaie un autre mot !
        </p>

        <!-- Saisie -->
        <WordInput :disabled="store.hasSubmitted" @submit="onSubmitWord" />

        <!-- Qui a soumis -->
        <WaitingDots
          :players="store.room?.players ?? []"
          :submitted-pseudos="store.submittedPseudos"
        />
      </template>

      <!-- ── PHASE: ROUND_RESULT (pas de match, auto-continue) ── -->
      <template v-else-if="store.phase === 'ROUND_RESULT'">
        <RoundResult
          v-if="store.lastRoundResult"
          :result="store.lastRoundResult"
          :manche-over="false"
        />
        <!-- Mots courants (après soumission) -->
        <CurrentWords :players="store.room?.players ?? []" :my-socket-id="store.mySocketId" />
      </template>

      <!-- ── PHASE: MANCHE_RESULT (match ou max sous-rounds) ── -->
      <template v-else-if="store.phase === 'MANCHE_RESULT'">
        <!-- Résultat du dernier sous-round -->
        <RoundResult
          v-if="store.lastRoundResult"
          :result="store.lastRoundResult"
          :manche-over="true"
        />

        <!-- Résumé de la manche -->
        <div
          v-if="store.lastMancheResult"
          :class="[
            'rounded-2xl border p-5 flex flex-col gap-3',
            store.lastMancheResult.hasMatch
              ? 'bg-teal-50 border-teal-200'
              : 'bg-stone-100 border-stone-200',
          ]"
        >
          <p
            class="text-xs font-semibold uppercase tracking-widest"
            :class="store.lastMancheResult.hasMatch ? 'text-teal-600' : 'text-stone-500'"
          >
            Manche {{ store.lastMancheResult.manche }} terminée
          </p>
          <p v-if="store.lastMancheResult.hasMatch" class="text-sm text-teal-800">
            🎯
            <strong>{{ store.lastMancheResult.winners.join(' & ') }}</strong>
            ont trouvé le même mot en
            {{ store.lastMancheResult.sousRoundsPlayed }} sous-round{{
              store.lastMancheResult.sousRoundsPlayed > 1 ? 's' : ''
            }}
            !
            <span class="ml-1 font-bold text-teal-600">+1 point</span>
          </p>
          <p v-else class="text-sm text-stone-600">
            ⏱ Aucun match en {{ store.lastMancheResult.sousRoundsPlayed }} sous-rounds.
          </p>
          <!-- Scores actuels -->
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-for="player in sortedPlayers"
              :key="player.socketId"
              :class="[
                'px-3 py-1 rounded-full text-xs font-semibold border',
                store.lastMancheResult.winners.includes(player.pseudo)
                  ? 'bg-teal-100 border-teal-300 text-teal-800'
                  : 'bg-stone-100 border-stone-200 text-stone-600',
              ]"
            >
              {{ player.pseudo }} — {{ player.score }} pt{{ player.score > 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <div v-if="!isLastManche">
          <BaseButton v-if="store.canNextManche" class="w-full" @click="onNextManche">
            Manche suivante →
          </BaseButton>
          <p v-else class="text-center text-sm text-stone-400">
            En attente de l'hôte pour la manche suivante…
          </p>
        </div>
        <div v-else>
          <BaseButton v-if="store.canNextManche" class="w-full" @click="onNextManche">
            Voir le podium →
          </BaseButton>
          <p v-else class="text-center text-sm text-stone-400">En attente de l'hôte…</p>
        </div>
      </template>

      <!-- ── PHASE: FINISHED (redirect en cours) ── -->
      <template v-else-if="store.phase === 'FINISHED'">
        <div class="text-center text-stone-500 text-sm py-8">Calcul du podium…</div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useTelepathieStore } from '../stores/useTelepathieStore';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';
import { telepathieSocket } from '../services/telepathie.service';
import TimerBar from '../components/game/TimerBar.vue';
import WordInput from '../components/game/WordInput.vue';
import WaitingDots from '../components/game/WaitingDots.vue';
import CurrentWords from '../components/game/CurrentWords.vue';
import RoundResult from '../components/game/RoundResult.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const store = useTelepathieStore();
const session = useTelepathieSessionStore();

const showScores = ref(false);
const duplicateError = ref(false);

const sortedPlayers = computed(() =>
  [...(store.room?.players ?? [])].sort((a, b) => b.score - a.score),
);

const isLastManche = computed(
  () => store.room !== null && store.room.currentManche >= store.room.settings.totalManches,
);

watch(
  () => store.error,
  (err) => {
    if (err === 'DUPLICATE_WORD') {
      duplicateError.value = true;
      store.clearError();
    }
  },
);

watch(
  () => store.phase,
  () => {
    duplicateError.value = false;
  },
);

onMounted(() => {
  if (!store.room && session.roomCode && session.pseudo) {
    telepathieSocket.join(session.roomCode, session.pseudo);
  }
});

function onSubmitWord(word: string): void {
  duplicateError.value = false;
  telepathieSocket.submit(word);
}

function onChooseWord(word: string): void {
  store.markChosen();
  telepathieSocket.chooseWord(word);
}

function onNextManche(): void {
  telepathieSocket.nextManche();
}
</script>
