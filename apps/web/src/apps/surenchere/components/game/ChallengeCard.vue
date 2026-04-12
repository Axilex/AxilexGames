<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
    <div v-if="challenge" class="flex flex-col gap-3">
      <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
        {{ challenge.category }}
      </span>
      <h2 class="text-2xl font-bold text-stone-900 leading-snug">
        {{ challenge.prompt }}
        <span class="text-amber-600">« {{ challenge.letter }} »</span>
      </h2>
    </div>
    <div v-else class="text-sm text-stone-400">En attente du défi…</div>

    <div class="flex items-center justify-between border-t border-stone-200 pt-4">
      <div class="flex flex-col">
        <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Mise courante
        </span>
        <span class="text-3xl font-extrabold text-stone-900">{{ currentBid }}</span>
      </div>
      <div v-if="currentBidder" class="flex flex-col items-end">
        <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Dernier enchérisseur
        </span>
        <span class="text-base font-bold text-amber-600">{{ currentBidder }}</span>
      </div>
    </div>

    <div
      v-if="wasForced && (phase === 'WORDS' || phase === 'VOTING')"
      class="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-800 font-semibold text-center"
    >
      🔥 Joueur forcé
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SurenchereChallenge, SurenchereGamePhase } from '@wiki-race/shared';

defineProps<{
  challenge: SurenchereChallenge | null;
  currentBid: number;
  currentBidder: string | null;
  phase: SurenchereGamePhase;
  wasForced?: boolean;
}>();
</script>
