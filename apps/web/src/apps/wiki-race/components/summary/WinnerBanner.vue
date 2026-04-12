<template>
  <div class="text-center py-6">
    <div v-if="winnerPseudo" class="flex flex-col items-center gap-3">
      <div class="text-6xl">
        {{ modeEmoji }}
      </div>
      <h2 class="text-3xl font-bold text-stone-900">
        {{ winnerPseudo }}
        <span class="text-amber-500">{{ winLabel }}</span>
      </h2>
      <p class="text-stone-500 text-lg">
        {{ subline }}
      </p>
    </div>
    <div v-else class="flex flex-col items-center gap-3">
      <div class="text-6xl">😶</div>
      <h2 class="text-3xl font-bold text-stone-700">Personne n'a gagné</h2>
      <p class="text-stone-400">Tous les joueurs ont abandonné ou aucun n'a atteint l'objectif.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameSummary } from '@wiki-race/shared';
import { GameMode } from '@wiki-race/shared';

const props = defineProps<{ summary: GameSummary }>();

const winnerPseudo = computed(() => props.summary.winnerPseudo);

const winner = computed(() => props.summary.players.find((p) => p.isWinner));

const modeEmoji = computed(() => {
  const emojis: Record<GameMode, string> = {
    [GameMode.CLASSIC]: '🏆',
    [GameMode.BINGO]: '🎯',
  };
  return emojis[props.summary.mode] ?? '🏆';
});

const winLabel = computed(() => {
  if (props.summary.mode === GameMode.BINGO) return 'remporte le bingo !';
  return 'a gagné !';
});

const formattedTime = computed(() => {
  const s = Math.floor((props.summary.endTime - props.summary.startTime) / 1000);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
});

const subline = computed(() => {
  const w = winner.value;
  if (!w) return '';

  if (props.summary.mode === GameMode.BINGO) {
    return `${w.bingoValidated.length} contrainte${w.bingoValidated.length !== 1 ? 's' : ''} validée${w.bingoValidated.length !== 1 ? 's' : ''} · ${formattedTime.value}`;
  }

  return `En ${formattedTime.value} · ${w.hopCount} clic${w.hopCount !== 1 ? 's' : ''}`;
});
</script>
