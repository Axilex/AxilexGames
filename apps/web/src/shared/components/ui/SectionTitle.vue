<template>
  <div class="flex items-center gap-4">
    <h2 class="text-xs font-bold text-foreground-subtle uppercase tracking-widest shrink-0">{{ title }}</h2>
    <div class="flex-1 h-px bg-border" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
