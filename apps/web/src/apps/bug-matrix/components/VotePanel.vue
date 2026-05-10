<template>
  <div class="bg-card rounded-2xl border border-border p-6 flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-bold text-foreground">À ton avis…</h2>
      <p class="text-sm text-foreground-muted mt-1">
        Pour chaque autre joueur, choisis : <b>Normal</b> (tu penses qu'il n'a pas de règle), ou la
        catégorie de règle que tu devines.
      </p>
    </div>

    <ul class="flex flex-col gap-3">
      <li
        v-for="t in targets"
        :key="t.pseudo"
        class="border border-border rounded-xl p-4 flex flex-col gap-3"
      >
        <p class="font-semibold text-foreground">{{ t.pseudo }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="label in LABELS"
            :key="label"
            type="button"
            :disabled="disabled"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors',
              isSelected(t.pseudo, label)
                ? selectedClass(label)
                : 'border border-border text-foreground-muted hover:border-border-strong',
              disabled ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            @click="emit('select', t.pseudo, label)"
          >
            {{ VOTE_LABELS_FR[label] }}
          </button>
        </div>
      </li>
    </ul>

    <BaseButton :disabled="!canSubmit" @click="emit('submit')">
      {{ disabled ? 'Vote envoyé' : canSubmit ? 'Envoyer mes votes' : 'Choisis une étiquette pour chacun' }}
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import type { BugMatrixPlayer, BugMatrixVoteLabel } from '@wiki-race/shared';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { VOTE_LABELS_FR } from '../labels';

const props = defineProps<{
  targets: BugMatrixPlayer[];
  pendingVotes: Record<string, BugMatrixVoteLabel>;
  canSubmit: boolean;
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', target: string, label: BugMatrixVoteLabel): void;
  (e: 'submit'): void;
}>();

const LABELS: BugMatrixVoteLabel[] = ['NORMAL', 'FORM', 'TONE', 'CONTENT'];

function isSelected(pseudo: string, label: BugMatrixVoteLabel): boolean {
  return props.pendingVotes[pseudo] === label;
}

function selectedClass(label: BugMatrixVoteLabel): string {
  if (label === 'NORMAL') return 'bg-emerald-500 text-white';
  if (label === 'FORM') return 'bg-blue-500 text-white';
  if (label === 'TONE') return 'bg-amber-500 text-white';
  return 'bg-fuchsia-500 text-white';
}
</script>
