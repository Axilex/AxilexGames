<template>
  <div class="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
    <p class="text-xs font-semibold text-foreground-subtle uppercase tracking-widest">Mots actuels</p>
    <ul class="flex flex-col gap-2">
      <li
        v-for="player in players"
        :key="player.socketId"
        :class="[
          'flex items-center justify-between text-sm rounded-xl px-3 py-2',
          player.socketId === mySocketId
            ? 'bg-teal-50 border border-teal-200'
            : 'bg-surface-muted border border-border',
        ]"
      >
        <span
          :class="[
            'font-medium',
            player.socketId === mySocketId ? 'text-teal-700' : 'text-foreground-muted',
          ]"
        >
          {{ player.pseudo }}
          <span v-if="player.socketId === mySocketId" class="text-[10px] ml-1 text-teal-400"
            >(toi)</span
          >
        </span>
        <span
          :class="[
            'font-bold tabular-nums',
            player.socketId === mySocketId ? 'text-teal-600' : 'text-foreground-muted',
          ]"
        >
          {{ player.currentWord ?? '—' }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { TelepathiePlayer } from '@wiki-race/shared';

defineProps<{
  players: TelepathiePlayer[];
  mySocketId: string;
}>();
</script>
