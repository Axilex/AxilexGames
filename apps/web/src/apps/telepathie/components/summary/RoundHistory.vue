<template>
  <div class="flex flex-col gap-3">
    <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
      Historique des manches
    </p>

    <div
      v-for="(manche, mIdx) in groupedByManche"
      :key="mIdx"
      :class="[
        'rounded-2xl border flex flex-col gap-3 p-4',
        manche.mancheResult?.hasMatch ? 'bg-teal-50 border-teal-200' : 'bg-white border-stone-200',
      ]"
    >
      <!-- Manche header -->
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-stone-500">
          Manche {{ manche.mancheResult?.manche ?? mIdx + 1 }}
        </span>
        <span
          v-if="manche.mancheResult?.hasMatch"
          class="text-xs text-teal-600 font-semibold"
        >
          🎯 Match en {{ manche.mancheResult.sousRoundsPlayed }} sous-round{{
            manche.mancheResult.sousRoundsPlayed > 1 ? 's' : ''
          }}
        </span>
        <span v-else-if="manche.mancheResult" class="text-xs text-stone-400">
          Aucun match ({{ manche.mancheResult.sousRoundsPlayed }} sous-rounds)
        </span>
      </div>

      <!-- Winners -->
      <div v-if="manche.mancheResult?.hasMatch" class="flex flex-wrap gap-2">
        <span
          v-for="pseudo in manche.mancheResult.winners"
          :key="pseudo"
          class="text-xs px-2 py-1 rounded-full border bg-teal-100 border-teal-300 text-teal-700 font-semibold"
        >
          {{ pseudo }} +1
        </span>
      </div>

      <!-- Sous-rounds detail -->
      <div class="flex flex-col gap-2">
        <div
          v-for="sr in manche.sousRounds"
          :key="`${sr.manche}-${sr.sousRound}`"
          class="rounded-xl border border-stone-150 bg-white/60 p-3 flex flex-col gap-1.5"
        >
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold text-stone-400">
              Sous-round {{ sr.sousRound }}
            </span>
            <span
              v-if="sr.hasMatch"
              class="text-[11px] text-teal-600 font-semibold"
            >
              Match !
            </span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="(word, pseudo) in sr.submissions"
              :key="pseudo"
              :class="[
                'text-xs px-2 py-0.5 rounded-lg border font-medium',
                sr.hasMatch && isInWinnerGroup(sr, pseudo as string)
                  ? 'bg-teal-100 border-teal-300 text-teal-800'
                  : 'bg-stone-50 border-stone-200 text-stone-600',
              ]"
            >
              <span class="font-semibold">{{ pseudo }}</span>
              <span class="mx-1 text-stone-300">→</span>
              <span>{{ word || '—' }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TelepathieMancheResult, TelepathieSousRoundResult } from '@wiki-race/shared';

const props = defineProps<{
  mancheResults: TelepathieMancheResult[];
  sousRoundHistory: TelepathieSousRoundResult[];
}>();

interface MancheGroup {
  mancheResult: TelepathieMancheResult | undefined;
  sousRounds: TelepathieSousRoundResult[];
}

const groupedByManche = computed<MancheGroup[]>(() => {
  const map = new Map<number, TelepathieSousRoundResult[]>();
  for (const sr of props.sousRoundHistory) {
    if (!map.has(sr.manche)) map.set(sr.manche, []);
    map.get(sr.manche)!.push(sr);
  }

  const manches: MancheGroup[] = [];
  for (const [mancheNum, sousRounds] of map) {
    manches.push({
      mancheResult: props.mancheResults.find((m) => m.manche === mancheNum),
      sousRounds: sousRounds.sort((a, b) => a.sousRound - b.sousRound),
    });
  }

  return manches.sort(
    (a, b) => (a.mancheResult?.manche ?? 0) - (b.mancheResult?.manche ?? 0),
  );
});

function isInWinnerGroup(sr: TelepathieSousRoundResult, pseudo: string): boolean {
  return sr.winnerGroups.some((g) => g.includes(pseudo));
}
</script>
