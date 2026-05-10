<template>
  <div
    v-if="role === 'NORMAL'"
    class="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 text-emerald-900 shadow-sm"
  >
    <p class="text-xs font-semibold uppercase tracking-wider text-emerald-600">Ta carte secrète</p>
    <p class="text-xl font-bold mt-1">Tu es <span class="text-emerald-700">Normal</span></p>
    <p class="text-sm mt-2 text-emerald-800">
      Tu n'as <b>aucune contrainte</b>. Réponds normalement et essaie de te fondre dans la masse — les autres
      essaient de te repérer.
    </p>
  </div>
  <div
    v-else-if="role === 'GLITCHED'"
    class="rounded-2xl border-2 border-fuchsia-300 bg-fuchsia-50 p-5 text-fuchsia-900 shadow-sm"
  >
    <p class="text-xs font-semibold uppercase tracking-wider text-fuchsia-600">Ta règle secrète</p>
    <p class="text-base font-semibold mt-1">{{ ruleLabel }}</p>
    <p
      v-if="ruleCategory"
      class="text-xs uppercase tracking-wider text-fuchsia-700 mt-2 font-bold"
    >
      Catégorie : {{ ruleCategoryFr(ruleCategory) }}
    </p>
    <p class="text-sm mt-2 text-fuchsia-800">
      Respecte cette règle dans <b>chacune de tes réponses</b>. Garde-la pour toi !
    </p>
  </div>
  <div
    v-else
    class="rounded-2xl border border-border bg-card p-5 text-foreground-muted text-sm text-center"
  >
    En attente de ton rôle…
  </div>
</template>

<script setup lang="ts">
import type { BugMatrixRole, BugMatrixRuleCategory } from '@wiki-race/shared';
import { ruleCategoryFr } from '../labels';

defineProps<{
  role: BugMatrixRole | null;
  ruleLabel: string;
  ruleCategory: BugMatrixRuleCategory | null;
}>();
</script>
