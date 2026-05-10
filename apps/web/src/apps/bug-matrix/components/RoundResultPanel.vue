<template>
  <div class="bg-card rounded-2xl border border-border p-6 flex flex-col gap-5">
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
        Manche {{ result.round }}
      </p>
      <p class="text-2xl font-bold text-foreground mt-1">
        Le Normal était <span class="text-emerald-600">{{ result.normalPseudo }}</span>
      </p>
    </div>

    <section>
      <h3 class="text-sm font-bold text-foreground-muted mb-2">Règles révélées</h3>
      <ul class="flex flex-col gap-2">
        <li
          v-for="r in result.rules"
          :key="r.pseudo"
          class="border border-border rounded-lg px-3 py-2 text-sm flex items-start gap-3"
        >
          <span class="font-semibold text-foreground min-w-[80px]">{{ r.pseudo }}</span>
          <span class="flex-1 text-foreground-muted">{{ r.ruleLabel }}</span>
          <span class="text-xs font-bold uppercase text-fuchsia-600">{{ VOTE_LABELS_FR[r.category] }}</span>
        </li>
      </ul>
    </section>

    <section>
      <h3 class="text-sm font-bold text-foreground-muted mb-2">Votes</h3>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-foreground-subtle text-xs uppercase">
            <th class="text-left py-1">Voteur</th>
            <th
              v-for="t in targetPseudos"
              :key="t"
              class="text-center py-1"
            >
              {{ t }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(targetMap, voter) in result.votes" :key="voter" class="border-t border-border">
            <td class="font-semibold py-2">{{ voter }}</td>
            <td v-for="t in targetPseudos" :key="t" class="text-center text-xs font-bold">
              <span :class="badgeClass(targetMap[t])">{{ targetMap[t] ? VOTE_LABELS_FR[targetMap[t]] : '—' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h3 class="text-sm font-bold text-foreground-muted mb-2">Points de la manche</h3>
      <ul class="flex flex-col gap-1 text-sm">
        <li
          v-for="(delta, pseudo) in result.scoreDeltas"
          :key="pseudo"
          class="flex justify-between"
        >
          <span class="font-semibold text-foreground">{{ pseudo }}</span>
          <span :class="delta > 0 ? 'text-emerald-600 font-bold' : 'text-foreground-muted'">
            +{{ delta }}
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BugMatrixRoundResult, BugMatrixVoteLabel } from '@wiki-race/shared';
import { VOTE_LABELS_FR } from '../labels';

const props = defineProps<{ result: BugMatrixRoundResult }>();

const targetPseudos = computed(() => {
  const set = new Set<string>();
  for (const targetMap of Object.values(props.result.votes)) {
    for (const t of Object.keys(targetMap)) set.add(t);
  }
  return [...set].sort();
});

function badgeClass(label?: BugMatrixVoteLabel): string {
  if (!label) return 'text-foreground-subtle';
  if (label === 'NORMAL') return 'inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-700';
  if (label === 'FORM') return 'inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700';
  if (label === 'TONE') return 'inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-700';
  return 'inline-block px-2 py-0.5 rounded bg-fuchsia-100 text-fuchsia-700';
}
</script>
