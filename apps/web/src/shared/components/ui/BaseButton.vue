<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      sizeClasses,
      variantClasses,
      (disabled || loading) && 'opacity-50 cursor-not-allowed',
    ]"
    v-bind="$attrs"
  >
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button', disabled: false, loading: false },
);

const sizeClasses = computed(
  () =>
    ({
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    })[props.size],
);

const variantClasses = computed(
  () =>
    ({
      primary:
        'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm focus-visible:ring-amber-500',
      secondary:
        'bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 border border-stone-300 shadow-sm focus-visible:ring-stone-400',
      danger:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm focus-visible:ring-red-500',
      ghost:
        'text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-stone-400',
    })[props.variant],
);
</script>
