<template>
  <div class="flex flex-col gap-4">
    <!-- Re-affichage de l'image -->
    <div class="w-full rounded-2xl overflow-hidden bg-stone-100" style="aspect-ratio: 4/3">
      <img :src="result.imageUrl" alt="Photo de la manche" class="w-full h-full object-cover" />
    </div>

    <!-- Groupes de mots -->
    <div class="flex flex-col gap-3">
      <div
        v-for="[word, pseudos] in sortedGroups"
        :key="word"
        :class="[
          'rounded-2xl border p-4 flex items-start gap-3',
          groupScore(pseudos) > 0 ? 'bg-white border-violet-200' : 'bg-stone-50 border-stone-200',
        ]"
      >
        <div class="flex-1 min-w-0">
          <p class="text-base font-bold text-stone-800 mb-1">« {{ word || '—' }} »</p>
          <p class="text-xs text-stone-500">
            {{ pseudos.join(', ') }}
          </p>
        </div>
        <div
          :class="[
            'shrink-0 text-right',
            groupScore(pseudos) > 0 ? 'text-violet-600' : 'text-stone-400',
          ]"
        >
          <span class="text-lg font-extrabold">+{{ groupScore(pseudos) }}</span>
          <span class="text-xs block">pts</span>
        </div>
      </div>
    </div>

    <!-- Scores courants -->
    <div class="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col gap-2">
      <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">Scores</p>
      <div
        v-for="[pseudo, total] in sortedScores"
        :key="pseudo"
        class="flex items-center justify-between"
      >
        <span class="text-sm text-stone-700">{{ pseudo }}</span>
        <span class="text-sm font-bold text-stone-900 tabular-nums">{{ total }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SnapAvisRoundResult } from '@wiki-race/shared';

const props = defineProps<{
  result: SnapAvisRoundResult;
  playerScores: Record<string, number>;
}>();

const N = computed(() => Object.keys(props.result.words).length);

function groupScore(pseudos: string[]): number {
  const G = pseudos.length;
  if (G === 1) return 0;
  if (G === N.value) return 1;
  return Math.round(10 / (G - 1));
}

const sortedGroups = computed(() =>
  Object.entries(props.result.groups).sort((a, b) => b[1].length - a[1].length),
);

const sortedScores = computed(() => Object.entries(props.playerScores).sort((a, b) => b[1] - a[1]));
</script>
