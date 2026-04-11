<template>
  <div class="flex items-center gap-2 overflow-x-auto">
    <span
      v-for="p in players"
      :key="p.socketId"
      :class="[
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border',
        p.socketId === mySocketId
          ? 'bg-amber-50 border-amber-200 text-amber-800'
          : 'bg-stone-50 border-stone-200 text-stone-700',
      ]"
    >
      {{ p.pseudo }}
      <span class="font-extrabold">{{ p.score }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { SurencherePlayer } from '@wiki-race/shared';

defineProps<{ players: SurencherePlayer[]; mySocketId: string }>();
</script>
