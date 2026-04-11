<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
        {{ isChooser ? 'À toi de choisir' : `${chooserName ?? 'Quelqu\'un'} choisit…` }}
      </span>
      <h2 class="text-xl font-bold text-stone-900">Choisis un défi</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button
        v-for="opt in options"
        :key="opt.id"
        :disabled="!isChooser"
        class="flex flex-col gap-2 p-4 rounded-xl border-2 border-stone-200 bg-stone-50 text-left transition"
        :class="
          isChooser
            ? 'hover:border-amber-500 hover:bg-amber-50 cursor-pointer'
            : 'opacity-60 cursor-not-allowed'
        "
        @click="pick(opt.id)"
      >
        <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
          {{ opt.category }}
        </span>
        <span class="text-sm text-stone-700 leading-snug">
          {{ opt.prompt }}
        </span>
        <span class="text-2xl font-extrabold text-stone-900">« {{ opt.letter }} »</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SurenchereChallenge } from '@wiki-race/shared';

const props = defineProps<{
  options: SurenchereChallenge[];
  isChooser: boolean;
  chooserName: string | null;
}>();

const emit = defineEmits<{ choose: [challengeId: string] }>();

function pick(id: string): void {
  if (props.isChooser) emit('choose', id);
}
</script>
