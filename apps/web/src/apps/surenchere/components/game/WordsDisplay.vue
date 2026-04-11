<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
        {{ bidderName ?? 'Joueur' }} propose
      </span>
      <h2 class="text-xl font-bold text-stone-900">Les mots</h2>
    </div>

    <ul v-if="words && words.length" class="flex flex-wrap gap-2">
      <li
        v-for="(w, i) in words"
        :key="i"
        class="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm font-medium text-stone-800"
      >
        {{ i + 1 }}. {{ w }}
      </li>
    </ul>
    <p v-else class="text-sm text-stone-400">Aucun mot soumis.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  words: string[] | null;
  bidderName: string | null;
}>();
</script>
