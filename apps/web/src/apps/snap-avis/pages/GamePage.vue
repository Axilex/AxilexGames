<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-stone-900">📸 Snap Avis</span>
          <span class="text-stone-300">·</span>
          <span class="text-xs text-stone-500">
            Manche {{ store.room?.currentRound ?? 1 }}/{{ store.room?.settings.totalRounds ?? 8 }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-violet-600 tabular-nums">
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
      <!-- Scores panel -->
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
            player.socketId === store.mySocketId ? 'font-bold text-violet-700' : 'text-stone-700',
          ]"
        >
          <span>{{ player.pseudo }}</span>
          <span class="tabular-nums font-bold">{{ player.score }}</span>
        </div>
      </div>

      <!-- ── PHASE: REVEALING ── -->
      <template v-if="store.phase === 'REVEALING'">
        <div class="text-center">
          <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">
            Mémorise cette image !
          </p>
          <ImageReveal
            v-if="store.currentImageUrl"
            :image-url="store.currentImageUrl"
            :reveal-duration-ms="store.room?.settings.revealDurationMs ?? 3000"
            @image-hidden="onImageHidden"
          />
        </div>
      </template>

      <!-- ── PHASE: WRITING ── -->
      <template v-else-if="store.phase === 'WRITING'">
        <div class="text-center mb-1">
          <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Écris UN mot pour décrire la photo
          </p>
        </div>

        <TimerBar
          v-if="store.writingEndsAt"
          :ends-at="store.writingEndsAt"
          :total-ms="store.room?.settings.writingDurationMs ?? 10000"
        />

        <WordInput :disabled="store.hasSubmitted" @submit="onSubmitWord" />

        <WaitingDots
          :players="store.room?.players ?? []"
          :submitted-pseudos="store.submittedPseudos"
        />
      </template>

      <!-- ── PHASE: RESULTS ── -->
      <template v-else-if="store.phase === 'RESULTS'">
        <WordsReveal
          v-if="store.lastResult"
          :result="store.lastResult"
          :player-scores="playerScores"
        />

        <BaseButton
          v-if="store.canGoNextRound"
          class="w-full"
          @click="onNextRound"
        >
          Manche suivante →
        </BaseButton>
        <p
          v-else-if="!store.isHost && store.phase === 'RESULTS'"
          class="text-center text-sm text-stone-400"
        >
          En attente de l'hôte pour la prochaine manche…
        </p>
      </template>

      <!-- ── PHASE: FINISHED (redirect en cours) ── -->
      <template v-else-if="store.phase === 'FINISHED'">
        <div class="text-center text-stone-500 text-sm py-8">Calcul du podium…</div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSnapAvisStore } from '../stores/useSnapAvisStore';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';
import { snapAvisSocket } from '../services/snap-avis.service';
import ImageReveal from '../components/game/ImageReveal.vue';
import TimerBar from '../components/game/TimerBar.vue';
import WordInput from '../components/game/WordInput.vue';
import WaitingDots from '../components/game/WaitingDots.vue';
import WordsReveal from '../components/game/WordsReveal.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const store = useSnapAvisStore();
const session = useSnapAvisSessionStore();

const showScores = ref(false);

const sortedPlayers = computed(() =>
  [...(store.room?.players ?? [])].sort((a, b) => b.score - a.score),
);

const playerScores = computed(() =>
  Object.fromEntries((store.room?.players ?? []).map((p) => [p.pseudo, p.score])),
);

onMounted(() => {
  if (!store.room && session.roomCode && session.pseudo) {
    snapAvisSocket.join(session.roomCode, session.pseudo);
  }
});

function onImageHidden(): void {
  // Image disappeared — phase WRITING arrives via socket event
}

function onSubmitWord(word: string): void {
  snapAvisSocket.submitWord(word);
}

function onNextRound(): void {
  snapAvisSocket.nextRound();
}
</script>
