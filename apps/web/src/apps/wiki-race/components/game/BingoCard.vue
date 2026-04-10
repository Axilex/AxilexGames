<template>
  <div class="flex flex-col gap-2">
    <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
      Bingo ({{ validated }}/{{ total }})
    </p>
    <div class="flex flex-col gap-1">
      <div
        v-for="constraint in constraints"
        :key="constraint.id"
        class="flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 transition-colors"
        :class="
          isValidated(constraint.id)
            ? 'bg-amber-50 border border-amber-200 text-amber-700'
            : 'bg-stone-50 border border-stone-100 text-stone-500'
        "
      >
        <span
          class="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px]"
          :class="
            isValidated(constraint.id)
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-stone-300 bg-white'
          "
        >
          <span v-if="isValidated(constraint.id)">✓</span>
        </span>
        <span class="truncate">{{ constraint.label }}</span>
        <span v-if="isRecent(constraint.id)" class="ml-auto text-amber-600 font-bold animate-pulse"
          >✨</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BINGO_CONSTRAINTS } from '@wiki-race/shared';
import type { BingoConstraintId } from '@wiki-race/shared';

const props = defineProps<{
  constraintIds: BingoConstraintId[];
  validated: BingoConstraintId[];
  recentlyValidated?: BingoConstraintId[];
}>();

const constraints = computed(() =>
  BINGO_CONSTRAINTS.filter((c) => props.constraintIds.includes(c.id)),
);
const total = computed(() => props.constraintIds.length);
const validated = computed(() => props.validated.length);

function isValidated(id: BingoConstraintId): boolean {
  return props.validated.includes(id);
}

function isRecent(id: BingoConstraintId): boolean {
  return props.recentlyValidated?.includes(id) ?? false;
}
</script>
