<template>
  <div class="bg-card rounded-2xl border border-border p-5 flex flex-col gap-2">
    <span class="text-xs font-semibold uppercase tracking-widest text-foreground-subtle"
      >Lien de partage</span
    >
    <div class="flex items-center gap-3">
      <span
        class="flex-1 text-xs font-mono text-foreground-muted truncate bg-surface-muted border border-border rounded-lg px-3 py-2"
      >
        {{ shareUrl }}
      </span>
      <button
        class="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 shrink-0"
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
