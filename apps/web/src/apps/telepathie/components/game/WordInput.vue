<template>
  <form class="flex gap-2" @submit.prevent="onSubmit">
    <input
      v-model="word"
      type="text"
      :disabled="disabled"
      :placeholder="disabled ? 'Mot envoyé ✅' : 'Votre mot...'"
      maxlength="40"
      :class="[
        'flex-1 rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 transition',
        disabled
          ? 'bg-surface-muted border-border text-foreground-subtle cursor-not-allowed'
          : 'border-border-strong text-foreground focus:ring-teal-400',
      ]"
      @keydown.enter.prevent="onSubmit"
    />
    <button
      type="submit"
      :disabled="disabled || !word.trim()"
      :class="[
        'px-5 py-3 rounded-xl text-sm font-semibold transition',
        disabled || !word.trim()
          ? 'bg-border text-foreground-subtle cursor-not-allowed'
          : 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700',
      ]"
    >
      {{ buttonLabel ?? 'Envoyer →' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  disabled: boolean;
  buttonLabel?: string;
}>();

const emit = defineEmits<{
  submit: [word: string];
}>();

const word = ref('');

function onSubmit(): void {
  if (props.disabled || !word.value.trim()) return;
  emit('submit', word.value.trim());
  word.value = '';
}
</script>
