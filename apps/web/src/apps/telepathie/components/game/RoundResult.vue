<template>
  <div class="flex flex-col gap-3">
    <!-- Statut -->
    <div
      :class="[
        'rounded-2xl p-4 text-center',
        result.hasMatch ? 'bg-teal-50 border border-teal-200' : 'bg-stone-100 border border-stone-200',
      ]"
    >
      <p v-if="result.hasMatch" class="text-base font-bold text-teal-700">
        🎯 Match trouvé !
      </p>
      <p v-else class="text-sm font-semibold text-stone-500">
        Pas de match — le jeu continue…
        <span v-if="!mancheOver" class="block text-xs font-normal mt-1 text-stone-400">
          Prochain sous-round dans {{ countdown }}s
        </span>
      </p>
    </div>

    <!-- Soumissions -->
    <div class="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col gap-2">
      <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
        Sous-round {{ result.sousRound }}
      </p>
      <div
        v-for="[pseudo, word] in Object.entries(result.submissions)"
        :key="pseudo"
        :class="[
          'flex items-center justify-between text-sm rounded-xl px-3 py-2',
          isWinner(pseudo) ? 'bg-teal-50 text-teal-700' : 'bg-stone-50 text-stone-600',
        ]"
      >
        <span class="font-medium">{{ pseudo }}</span>
        <span class="font-bold">{{ word || '(pas de mot)' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { TelepathieSousRoundResult } from '@wiki-race/shared';

const props = defineProps<{
  result: TelepathieSousRoundResult;
  mancheOver: boolean;
}>();

const countdown = ref(3);
let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (!props.mancheOver) {
    interval = setInterval(() => {
      countdown.value = Math.max(0, countdown.value - 1);
    }, 1000);
  }
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const winnerPseudos = computed(() => new Set(props.result.winnerGroups.flat()));

function isWinner(pseudo: string): boolean {
  return winnerPseudos.value.has(pseudo);
}
</script>
