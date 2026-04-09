<template>
  <div class="text-center py-6">
    <div
      v-if="winnerPseudo"
      class="flex flex-col items-center gap-3"
    >
      <div class="text-6xl">
        🏆
      </div>
      <h2 class="text-3xl font-bold text-stone-900">
        {{ winnerPseudo }}
        <span class="text-amber-500">a gagné !</span>
      </h2>
      <p class="text-stone-500 text-lg">
        En {{ formattedTime }} · {{ winnerHops }} clic{{ winnerHops !== 1 ? 's' : '' }}
      </p>
    </div>
    <div
      v-else
      class="flex flex-col items-center gap-3"
    >
      <div class="text-6xl">
        😶
      </div>
      <h2 class="text-3xl font-bold text-stone-700">
        Personne n'a gagné
      </h2>
      <p class="text-stone-400">
        Tous les joueurs ont abandonné.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameSummary } from '@wiki-race/shared';

const props = defineProps<{ summary: GameSummary }>();

const winnerPseudo = computed(() => props.summary.winnerPseudo);
const winnerHops = computed(() => props.summary.players.find((p) => p.isWinner)?.hopCount ?? 0);
const formattedTime = computed(() => {
  const s = Math.floor((props.summary.endTime - props.summary.startTime) / 1000);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
});
</script>
