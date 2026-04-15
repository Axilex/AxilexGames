<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-3">
    <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">Historique</span>
    <ul v-if="history.length" class="flex flex-col gap-2">
      <li
        v-for="(r, i) in history.slice(0, 5)"
        :key="i"
        class="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm flex flex-col gap-1"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold text-stone-900">{{ r.bidderPseudo }}</span>
          <span
            :class="[
              'text-xs font-bold px-2 py-0.5 rounded-full',
              r.success
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200',
            ]"
          >
            {{ r.scoreDelta >= 0 ? '+' : '' }}{{ r.scoreDelta }}
          </span>
        </div>
        <span class="text-xs text-stone-500 truncate">
          {{ r.challenge.category }} × {{ r.bid }}
        </span>
        <div v-if="r.wasForced" class="flex">
          <span
            class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"
          >
            🔥 Forcé
          </span>
        </div>
        <div v-if="r.words && r.words.length" class="flex flex-wrap gap-1">
          <span
            v-for="(w, wi) in r.words.slice(0, 5)"
            :key="wi"
            :class="[
              'text-[11px] rounded px-1.5 py-0.5',
              r.wordVerdicts?.[wi] === true
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : r.wordVerdicts?.[wi] === false
                  ? 'bg-red-50 border border-red-200 text-red-700 line-through'
                  : 'bg-white border border-stone-200 text-stone-700',
            ]"
          >
            {{ w }}
          </span>
          <span v-if="r.words.length > 5" class="text-[11px] text-stone-400 px-1">
            +{{ r.words.length - 5 }}
          </span>
        </div>
      </li>
    </ul>
    <p v-else class="text-sm text-stone-400">Aucune manche terminée.</p>
  </div>
</template>

<script setup lang="ts">
import type { SurenchereRoundResult } from '@wiki-race/shared';

defineProps<{ history: SurenchereRoundResult[] }>();
</script>
