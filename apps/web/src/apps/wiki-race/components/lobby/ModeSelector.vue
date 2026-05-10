<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-semibold text-foreground-muted uppercase tracking-widest">Mode de jeu</span>
    <div class="grid grid-cols-1 gap-2">
      <button
        v-for="m in modes"
        :key="m.value"
        type="button"
        class="flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
        :class="
          modelValue === m.value
            ? 'border-amber-400 bg-amber-50 text-foreground'
            : 'border-border bg-card text-foreground-muted hover:border-border-strong hover:bg-surface-muted'
        "
        @click="$emit('update:modelValue', m.value)"
      >
        <span class="text-xl leading-none mt-0.5">{{ m.icon }}</span>
        <div>
          <div class="text-sm font-semibold">
            {{ m.label }}
          </div>
          <div class="text-xs text-foreground-subtle">
            {{ m.description }}
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GameMode } from '@wiki-race/shared';

defineProps<{ modelValue: GameMode }>();
defineEmits<{ (e: 'update:modelValue', v: GameMode): void }>();

const modes = [
  {
    value: GameMode.CLASSIC,
    icon: '🏁',
    label: 'Classique',
    description: 'Premier à atteindre la page cible gagne.',
  },
  {
    value: GameMode.BINGO,
    icon: '🎯',
    label: 'Bingo Wiki',
    description: 'Validez un maximum de contraintes en visitant des pages.',
  },
];
</script>
