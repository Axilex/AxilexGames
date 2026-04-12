<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="id" class="text-sm font-medium text-stone-700">
      {{ label }}
    </label>
    <input
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :disabled="disabled"
      :type="type"
      :class="[
        'bg-white border rounded-lg text-stone-900 placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
        size === 'lg' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm',
        error ? 'border-red-400 bg-red-50' : 'border-stone-300 hover:border-stone-400',
        disabled && 'opacity-50 cursor-not-allowed bg-stone-50',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown.enter="$emit('enter')"
    />
    <p v-if="error" class="text-xs text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    error?: string;
    maxlength?: number;
    disabled?: boolean;
    type?: string;
    id?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    type: 'text',
    disabled: false,
    label: undefined,
    placeholder: undefined,
    error: undefined,
    maxlength: undefined,
    id: undefined,
    size: 'md',
  },
);

defineEmits<{
  'update:modelValue': [value: string];
  enter: [];
}>();
</script>
