<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-stone-500 uppercase tracking-widest">
        Contraintes Bingo
      </span>
      <span class="text-xs" :class="isValid ? 'text-amber-600' : 'text-stone-400'">
        {{ modelValue.length }}/{{ max }} sélectionnées ({{ min }}–{{ max }} requises)
      </span>
    </div>
    <div class="grid grid-cols-1 gap-1.5">
      <button
        v-for="constraint in BINGO_CONSTRAINTS"
        :key="constraint.id"
        type="button"
        class="flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors"
        :class="[
          isSelected(constraint.id)
            ? 'border-amber-400 bg-amber-50 text-stone-900'
            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300',
          !isSelected(constraint.id) && modelValue.length >= max
            ? 'opacity-40 cursor-not-allowed'
            : 'cursor-pointer',
        ]"
        :disabled="!isSelected(constraint.id) && modelValue.length >= max"
        @click="toggle(constraint.id)"
      >
        <span
          class="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs"
          :class="
            isSelected(constraint.id)
              ? 'border-amber-500 bg-amber-500 text-white'
              : 'border-stone-300 bg-white'
          "
        >
          <span v-if="isSelected(constraint.id)">✓</span>
        </span>
        {{ constraint.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BINGO_CONSTRAINTS } from '@wiki-race/shared';
import type { BingoConstraintId } from '@wiki-race/shared';

const props = withDefaults(
  defineProps<{
    modelValue: BingoConstraintId[];
    min?: number;
    max?: number;
  }>(),
  { min: 4, max: 6 },
);

const emit = defineEmits<{ (e: 'update:modelValue', v: BingoConstraintId[]): void }>();

const isValid = computed(
  () => props.modelValue.length >= props.min && props.modelValue.length <= props.max,
);

function isSelected(id: BingoConstraintId): boolean {
  return props.modelValue.includes(id);
}

function toggle(id: BingoConstraintId): void {
  if (isSelected(id)) {
    emit(
      'update:modelValue',
      props.modelValue.filter((c) => c !== id),
    );
  } else if (props.modelValue.length < props.max) {
    emit('update:modelValue', [...props.modelValue, id]);
  }
}
</script>
