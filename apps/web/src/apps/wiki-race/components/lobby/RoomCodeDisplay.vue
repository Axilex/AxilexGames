<template>
  <div class="flex flex-col gap-2">
    <p class="text-xs font-semibold text-stone-500 uppercase tracking-widest">Code de la room</p>
    <div class="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
      <span class="flex-1 text-3xl font-mono font-bold tracking-[0.2em] text-stone-900 select-all">
        {{ code }}
      </span>
      <button
        class="text-stone-400 hover:text-amber-600 transition-colors p-1 rounded-lg hover:bg-amber-50"
        :title="copied ? 'Copié !' : 'Copier le code'"
        @click="copy"
      >
        <svg v-if="!copied" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          class="h-5 w-5 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ code: string }>();
const copied = ref(false);

async function copy() {
  await navigator.clipboard.writeText(props.code);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>
