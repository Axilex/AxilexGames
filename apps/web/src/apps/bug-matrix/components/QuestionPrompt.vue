<template>
  <div class="bg-card rounded-2xl border border-border p-6 text-center">
    <p class="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">Question</p>
    <p class="text-2xl md:text-3xl font-bold text-foreground mt-2">{{ text }}</p>
    <p class="text-sm text-foreground-muted mt-3">
      Discutez à l'oral entre vous. La question changera dans quelques secondes.
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>
