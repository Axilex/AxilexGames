<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="player in players"
      :key="player.socketId"
      :class="[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition',
        submittedPseudos.includes(player.pseudo)
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-stone-100 border-stone-200 text-stone-500',
      ]"
    >
      <span>{{ submittedPseudos.includes(player.pseudo) ? '✅' : '⏳' }}</span>
      <span>{{ player.pseudo }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnapAvisPlayer } from '@wiki-race/shared';

defineProps<{
  players: SnapAvisPlayer[];
  submittedPseudos: string[];
}>();
</script>
