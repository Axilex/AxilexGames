<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-2">
    <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">Code room</span>
    <div class="flex items-center gap-3">
      <code
        class="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-2xl font-bold tracking-[0.3em] text-stone-900 text-center"
      >
        {{ code || '—' }}
      </code>
      <button
        v-if="code"
        class="px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200"
        @click="copy"
      >
        {{ copied ? 'Copié!' : 'Copier' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ code: string }>();
const copied = ref(false);

function copy(): void {
  navigator.clipboard.writeText(props.code).then(() => {
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  });
}
</script>
