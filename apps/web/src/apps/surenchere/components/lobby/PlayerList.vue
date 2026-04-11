<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-3">
    <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">
      Joueurs ({{ players.length }})
    </span>
    <ul class="flex flex-col gap-2">
      <li
        v-for="p in players"
        :key="p.socketId"
        :class="[
          'flex items-center justify-between rounded-lg border px-3 py-2',
          p.socketId === mySocketId
            ? 'bg-amber-50 border-amber-200'
            : 'bg-stone-50 border-stone-200',
        ]"
      >
        <div class="flex items-center gap-2">
          <span
            :class="[
              'w-2 h-2 rounded-full',
              p.isConnected ? 'bg-emerald-500' : 'bg-stone-300',
            ]"
          />
          <span class="text-sm font-medium text-stone-900">{{ p.pseudo }}</span>
          <span
            v-if="p.isHost"
            class="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded"
          >
            Host
          </span>
        </div>
        <span class="text-sm font-bold text-stone-500">{{ p.score }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { SurencherePlayer } from '@wiki-race/shared';

defineProps<{ players: SurencherePlayer[]; mySocketId: string }>();
</script>
