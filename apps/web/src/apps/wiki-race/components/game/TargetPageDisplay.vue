<template>
  <div class="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
    <svg class="h-4 w-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
        clip-rule="evenodd"
      />
    </svg>
    <span class="text-xs font-medium text-amber-700 uppercase tracking-wide shrink-0">Cible</span>
    <span class="text-sm font-semibold text-amber-900 truncate">{{
      decodeURIComponent(targetSlug).replace(/_/g, ' ')
    }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ targetSlug: string }>();
</script>
