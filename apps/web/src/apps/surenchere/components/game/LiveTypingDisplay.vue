<template>
  <div
    v-if="text"
    class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-stone-700"
  >
    <span class="font-semibold text-amber-700">{{ pseudo }}</span>
    <span class="text-stone-500"> est en train d'écrire : </span>
    <span class="italic text-stone-800">{{ text }}…</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ pseudo: string; text: string }>();
</script>
