<template>
  <div class="flex flex-col gap-1.5">
    <p class="text-xs font-semibold text-stone-500 uppercase tracking-widest">
      Lien de partage
    </p>
    <div class="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
      <span class="flex-1 text-xs text-stone-500 font-mono truncate">{{ shareUrl }}</span>
      <button
        class="shrink-0 text-stone-400 hover:text-amber-600 transition-colors p-1 rounded hover:bg-amber-50"
        :title="copied ? 'Copié !' : 'Copier le lien'"
        @click="copy"
      >
        <svg
          v-if="!copied"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          class="h-4 w-4 text-emerald-500"
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
import { computed, ref } from 'vue';

const props = defineProps<{ roomCode: string }>();
const copied = ref(false);
const shareUrl = computed(() => `${window.location.origin}/wikirace?code=${props.roomCode}`);

async function copy() {
  await navigator.clipboard.writeText(shareUrl.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}
</script>
