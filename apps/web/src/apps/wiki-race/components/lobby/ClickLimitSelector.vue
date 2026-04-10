<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-semibold text-stone-500 uppercase tracking-widest">
      {{ label }}
    </span>
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="opt in options"
        :key="opt"
        type="button"
        class="px-4 py-2 rounded-lg border text-sm font-medium transition-colors"
        :class="
          modelValue === opt
            ? 'border-amber-400 bg-amber-50 text-amber-700'
            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
        "
        @click="$emit('update:modelValue', opt)"
      >
        {{ opt }} clics
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: number;
    label?: string;
    options?: number[];
  }>(),
  {
    label: 'Nombre de clics maximum',
    options: () => [4, 5, 6],
  },
);
defineEmits<{ (e: 'update:modelValue', v: number): void }>();
</script>
