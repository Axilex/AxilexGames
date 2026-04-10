<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-semibold text-stone-500 uppercase tracking-widest">
      {{ label }}
    </span>
    <div class="flex flex-wrap items-center gap-2">
      <!-- Preset buttons -->
      <button
        v-for="opt in options"
        :key="opt"
        type="button"
        class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
        :class="
          modelValue === opt
            ? 'border-amber-400 bg-amber-50 text-amber-700'
            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
        "
        @click="$emit('update:modelValue', opt)"
      >
        {{ opt }}
      </button>

      <!-- Free input -->
      <div class="flex items-center gap-1">
        <input
          type="number"
          min="1"
          max="999"
          placeholder="—"
          :value="isCustom ? modelValue : ''"
          class="w-14 px-2 py-1.5 rounded-lg border text-sm text-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          :class="
            isCustom
              ? 'border-amber-400 bg-amber-50 text-amber-700'
              : 'border-stone-200 bg-white text-stone-600'
          "
          @change="onCustomInput"
        />
        <span class="text-xs text-stone-400">clics</span>
      </div>

      <!-- ∞ Illimité -->
      <button
        v-if="allowInfinite"
        type="button"
        class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
        :class="
          modelValue === null
            ? 'border-amber-400 bg-amber-50 text-amber-700'
            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
        "
        @click="$emit('update:modelValue', null)"
      >
        ∞ Illimité
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    label?: string;
    options?: number[];
    allowInfinite?: boolean;
  }>(),
  {
    label: 'Nombre de clics maximum',
    options: () => [4, 5, 6],
    allowInfinite: false,
  },
);

const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>();

const isCustom = computed(
  () => props.modelValue !== null && !props.options.includes(props.modelValue),
);

function onCustomInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val) && val >= 1) {
    emit('update:modelValue', val);
  }
}
</script>
