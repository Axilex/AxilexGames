<template>
  <div class="flex flex-col gap-3">
    <form class="flex gap-2" @submit.prevent="submit">
      <input
        ref="inputRef"
        v-model="word"
        type="text"
        :disabled="disabled"
        :placeholder="disabled ? 'Mot envoyé ✓' : 'Ton mot…'"
        maxlength="32"
        class="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed transition"
        autocomplete="off"
        autocorrect="off"
        spellcheck="false"
      />
      <button
        type="submit"
        :disabled="disabled || !word.trim()"
        class="px-5 py-3 rounded-xl text-sm font-semibold text-white bg-violet-500 hover:bg-violet-600 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed transition"
      >
        {{ disabled ? '✓' : 'Envoyer →' }}
      </button>
    </form>
    <p v-if="disabled" class="text-xs text-emerald-600 font-medium text-center">
      Mot envoyé ! En attente des autres joueurs…
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{ disabled: boolean }>();
const emit = defineEmits<{ submit: [word: string] }>();

const word = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.disabled,
  async (val) => {
    if (!val) {
      word.value = '';
      await nextTick();
      inputRef.value?.focus();
    }
  },
);

function submit(): void {
  const trimmed = word.value.trim();
  if (!trimmed || props.disabled) return;
  emit('submit', trimmed);
}
</script>
