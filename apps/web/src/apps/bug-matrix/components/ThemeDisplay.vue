<template>
  <div
    class="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100/60"
  >
    <p class="text-xs font-semibold uppercase tracking-wider text-white/70">Thème commun</p>
    <p class="text-2xl font-bold mt-1">{{ themeLabel }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ themeLabel: string }>();
</script>
