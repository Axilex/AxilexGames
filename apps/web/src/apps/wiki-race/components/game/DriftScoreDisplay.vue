<template>
  <div class="flex flex-col gap-1">
    <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
      WikiDrift — {{ objectiveLabel }}
    </p>
    <div
      v-if="bestScore !== null"
      class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs"
    >
      <div class="text-amber-700 font-semibold">Meilleur score : {{ formatScore(bestScore) }}</div>
      <div v-if="bestSlug" class="text-stone-500 truncate">
        {{ decodeURIComponent(bestSlug).replace(/_/g, ' ') }}
      </div>
    </div>
    <div v-else class="text-xs text-stone-400">Naviguez pour trouver votre meilleure page !</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DriftObjective } from '@wiki-race/shared';

const props = defineProps<{
  objective: DriftObjective;
  bestScore: number | null;
  bestSlug: string | null;
}>();

const objectiveLabel = computed(() => {
  const labels: Record<DriftObjective, string> = {
    [DriftObjective.OLDEST_TITLE_YEAR]: 'Page la plus ancienne',
    [DriftObjective.SHORTEST]: 'Page la plus courte',
    [DriftObjective.MOST_IMAGES]: "Plus d'images",
  };
  return labels[props.objective];
});

function formatScore(score: number): string {
  if (props.objective === DriftObjective.OLDEST_TITLE_YEAR) {
    return score === 9999 ? '(aucune année)' : String(score);
  }
  if (props.objective === DriftObjective.SHORTEST) return `${score} mots`;
  if (props.objective === DriftObjective.MOST_IMAGES) return `${score} images`;
  return String(score);
}
</script>
