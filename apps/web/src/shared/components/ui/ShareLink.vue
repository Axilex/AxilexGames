<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-2">
    <span class="text-xs font-semibold uppercase tracking-widest text-stone-400"
      >Lien de partage</span
    >
    <div class="flex items-center gap-3">
      <span
        class="flex-1 text-xs font-mono text-stone-500 truncate bg-stone-50 border border-stone-200 rounded-lg px-3 py-2"
      >
        {{ shareUrl }}
      </span>
      <button
        class="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 shrink-0"
        @click="copy"
      >
        {{ copied ? 'Copié!' : 'Copier' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ shareUrl: string }>();
const copied = ref(false);

function copy(): void {
  navigator.clipboard.writeText(props.shareUrl).then(() => {
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  });
}
</script>
