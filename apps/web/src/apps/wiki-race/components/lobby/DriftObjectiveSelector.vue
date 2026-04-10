<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-semibold text-stone-500 uppercase tracking-widest">Objectif</span>
    <div class="flex flex-col gap-2">
      <button
        v-for="opt in objectives"
        :key="opt.value"
        type="button"
        class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
        :class="
          modelValue === opt.value
            ? 'border-amber-400 bg-amber-50 text-stone-900'
            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
        "
        @click="$emit('update:modelValue', opt.value)"
      >
        <span class="text-lg">{{ opt.icon }}</span>
        <div>
          <div class="text-sm font-semibold">
            {{ opt.label }}
          </div>
          <div class="text-xs text-stone-400">
            {{ opt.description }}
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DriftObjective } from '@wiki-race/shared';

defineProps<{ modelValue: DriftObjective }>();
defineEmits<{ (e: 'update:modelValue', v: DriftObjective): void }>();

const objectives = [
  {
    value: DriftObjective.OLDEST_TITLE_YEAR,
    icon: '📜',
    label: 'Page la plus ancienne',
    description: 'Trouvez une page dont le titre contient la plus vieille année.',
  },
  {
    value: DriftObjective.SHORTEST,
    icon: '📄',
    label: 'Page la plus courte',
    description: 'Trouvez la page avec le moins de mots.',
  },
  {
    value: DriftObjective.MOST_IMAGES,
    icon: '🖼️',
    label: "Page avec le plus d'images",
    description: "Trouvez la page avec le plus d'images.",
  },
];
</script>
