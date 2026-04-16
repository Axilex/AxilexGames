<template>
  <div class="flex flex-col gap-3">
    <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
      Historique des manches
    </p>
    <div
      v-for="result in results"
      :key="result.manche"
      :class="[
        'rounded-2xl border p-4 flex flex-col gap-2',
        result.hasMatch ? 'bg-teal-50 border-teal-200' : 'bg-white border-stone-200',
      ]"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-stone-500">Manche {{ result.manche }}</span>
        <span v-if="result.hasMatch" class="text-xs text-teal-600 font-semibold">
          🎯 Match en {{ result.sousRoundsPlayed }} sous-round{{ result.sousRoundsPlayed > 1 ? 's' : '' }}
        </span>
        <span v-else class="text-xs text-stone-400">
          Aucun match ({{ result.sousRoundsPlayed }} sous-rounds)
        </span>
      </div>
      <div v-if="result.hasMatch" class="flex flex-wrap gap-2">
        <span
          v-for="pseudo in result.winners"
          :key="pseudo"
          class="text-xs px-2 py-1 rounded-full border bg-teal-100 border-teal-300 text-teal-700 font-semibold"
        >
          {{ pseudo }} +1
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TelepathieMancheResult } from '@wiki-race/shared';

defineProps<{
  results: TelepathieMancheResult[];
}>();
</script>
