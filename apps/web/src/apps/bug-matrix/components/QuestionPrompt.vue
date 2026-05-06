<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 text-center">
    <p class="text-xs font-semibold uppercase tracking-wider text-stone-400">Question</p>
    <p class="text-2xl md:text-3xl font-bold text-stone-900 mt-2">{{ text }}</p>
    <p class="text-sm text-stone-500 mt-3">
      Discutez à l'oral entre vous. La question changera dans quelques secondes.
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>
