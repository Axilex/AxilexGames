<template>
  <div class="flex flex-col gap-2">
    <p class="text-xs font-semibold text-stone-500 uppercase tracking-widest">Limite de temps</p>
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="option in options"
        :key="option.value ?? 'none'"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
          modelValue === option.value
            ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
            : 'bg-white border-stone-300 text-stone-700 hover:border-amber-400 hover:text-amber-600',
        ]"
        @click="$emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: number | null }>();
defineEmits<{ 'update:modelValue': [value: number | null] }>();

const options = [
  { label: 'Sans limite', value: null },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 },
  { label: '20 min', value: 1200 },
];
</script>
