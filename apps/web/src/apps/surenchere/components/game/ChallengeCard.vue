<template>
  <div class="bg-card rounded-2xl border border-border p-6 flex flex-col gap-4">
    <div v-if="challenge" class="flex flex-col gap-3">
      <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
        {{ challenge.category }}
      </span>
      <h2 class="text-2xl font-bold text-foreground leading-snug">
        {{ challenge.prompt }}
      </h2>
    </div>
    <div v-else class="text-sm text-foreground-subtle">En attente du défi…</div>

    <div class="flex items-center justify-between border-t border-border pt-4">
      <div class="flex flex-col">
        <span class="text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
          Mise courante
        </span>
        <span class="text-3xl font-extrabold text-foreground">{{ currentBid }}</span>
      </div>
      <div v-if="currentBidder" class="flex flex-col items-end">
        <span class="text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
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
