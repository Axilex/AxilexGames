<template>
  <div class="flex flex-col gap-6">
    <h3 class="text-sm font-semibold text-stone-500 uppercase tracking-widest">Résultats Bingo</h3>

    <!-- Ranking -->
    <div class="flex flex-col gap-2">
      <div
        v-for="player in rankedPlayers"
        :key="player.pseudo"
        class="flex items-center gap-3 bg-white rounded-xl border px-4 py-3"
        :class="player.isWinner ? 'border-amber-300 bg-amber-50' : 'border-stone-200'"
      >
        <span class="text-xl font-bold text-stone-400 w-7 text-center">
          {{
            player.rank === 1
              ? '🥇'
              : player.rank === 2
                ? '🥈'
                : player.rank === 3
                  ? '🥉'
                  : player.rank
          }}
        </span>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-stone-900 text-sm">
            {{ player.pseudo }}
          </div>
          <div class="text-xs text-stone-500">
            {{ player.bingoValidated.length }}/{{ totalConstraints }} contraintes ·
            {{ player.hopCount }} clic{{ player.hopCount !== 1 ? 's' : '' }}
          </div>
        </div>
        <!-- Mini bingo grid -->
        <div class="flex gap-1 flex-wrap max-w-[80px]">
          <span
            v-for="entry in player.bingoCardEntries"
            :key="entry.constraintId"
            :title="
              constraintLabel(entry.constraintId) +
              (entry.validatedOnSlug
                ? ' · ' + decodeURIComponent(entry.validatedOnSlug).replace(/_/g, ' ')
                : '')
            "
            class="w-5 h-5 rounded border text-[10px] flex items-center justify-center"
            :class="
              entry.validated
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white border-stone-200 text-stone-300'
            "
          >
            {{ entry.validated ? '✓' : '·' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Constraints legend -->
    <div v-if="constraintIds.length" class="bg-stone-50 rounded-xl border border-stone-200 p-4">
      <h4 class="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
        Contraintes
      </h4>
      <div class="grid grid-cols-1 gap-1.5">
        <div
          v-for="c in constraintsMeta"
          :key="c.id"
          class="flex items-center gap-2 text-xs text-stone-600"
        >
          <span
            class="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center shrink-0 text-[10px]"
            >✓</span
          >
          {{ c.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameSummary } from '@wiki-race/shared';
import { BINGO_CONSTRAINTS } from '@wiki-race/shared';
import type { BingoConstraintId } from '@wiki-race/shared';

const props = defineProps<{ summary: GameSummary }>();

const constraintIds = computed(() => props.summary.bingoConstraintIds ?? []);
const totalConstraints = computed(() => constraintIds.value.length);

const rankedPlayers = computed(() =>
  [...props.summary.players].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
);

const constraintsMeta = computed(() =>
  BINGO_CONSTRAINTS.filter((c) => constraintIds.value.includes(c.id)),
);

function constraintLabel(id: BingoConstraintId): string {
  return BINGO_CONSTRAINTS.find((c) => c.id === id)?.label ?? id;
}
</script>
