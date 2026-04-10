<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-sm font-semibold text-stone-500 uppercase tracking-widest">
      Classement WikiDrift — {{ objectiveLabel }}
    </h3>
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
          <div class="font-semibold text-stone-900 text-sm">{{ player.pseudo }}</div>
          <div v-if="player.driftBestSlug" class="text-xs text-stone-500 truncate">
            {{ decodeURIComponent(player.driftBestSlug).replace(/_/g, ' ') }}
          </div>
          <div v-else class="text-xs text-stone-400">Aucune page visitée</div>
        </div>
        <div class="shrink-0 text-right">
          <div class="font-bold text-sm text-amber-700">
            {{ formatScore(player.driftBestScore) }}
          </div>
          <div class="text-xs text-stone-400">
            {{ player.hopCount }} clic{{ player.hopCount !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameSummary } from '@wiki-race/shared';
import { DriftObjective } from '@wiki-race/shared';

const props = defineProps<{ summary: GameSummary }>();

const rankedPlayers = computed(() =>
  [...props.summary.players].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
);

const objectiveLabel = computed(() => {
  const labels: Record<DriftObjective, string> = {
    [DriftObjective.OLDEST_TITLE_YEAR]: 'Page la plus ancienne',
    [DriftObjective.SHORTEST]: 'Page la plus courte',
    [DriftObjective.MOST_IMAGES]: "Plus d'images",
  };
  return props.summary.driftObjective ? labels[props.summary.driftObjective] : '';
});

function formatScore(score: number | null): string {
  if (score === null) return '—';
  if (!props.summary.driftObjective) return String(score);
  if (props.summary.driftObjective === DriftObjective.OLDEST_TITLE_YEAR)
    return score === 9999 ? '(aucune année)' : `an ${score}`;
  if (props.summary.driftObjective === DriftObjective.SHORTEST) return `${score} mots`;
  if (props.summary.driftObjective === DriftObjective.MOST_IMAGES) return `${score} imgs`;
  return String(score);
}
</script>
