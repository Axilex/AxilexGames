<template>
  <div class="flex flex-col gap-2">
    <p class="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-1">
      Joueurs ({{ players.length }}/8)
    </p>
    <TransitionGroup
      name="player-list"
      tag="ul"
      class="flex flex-col gap-1.5"
    >
      <li
        v-for="player in players"
        :key="player.pseudo"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-stone-100 bg-stone-50"
      >
        <svg
          v-if="player.isHost"
          class="h-4 w-4 text-amber-500 shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span
          v-else
          class="h-4 w-4 shrink-0"
        />
        <span class="flex-1 text-sm font-medium text-stone-800 truncate">{{ player.pseudo }}</span>
        <span :class="['text-xs font-medium px-2 py-0.5 rounded-full', statusClass(player.status)]">
          {{ statusLabel(player.status) }}
        </span>
      </li>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { PlayerStatus } from '@wiki-race/shared';
import type { PlayerDTO } from '@wiki-race/shared';

defineProps<{ players: PlayerDTO[] }>();

function statusClass(status: PlayerStatus): string {
  return ({
    [PlayerStatus.CONNECTED]: 'bg-emerald-100 text-emerald-700',
    [PlayerStatus.DISCONNECTED]: 'bg-amber-100 text-amber-700',
    [PlayerStatus.SURRENDERED]: 'bg-red-100 text-red-700',
    [PlayerStatus.FINISHED]: 'bg-amber-100 text-amber-700',
  }[status] ?? 'bg-stone-100 text-stone-600');
}

function statusLabel(status: PlayerStatus): string {
  return ({
    [PlayerStatus.CONNECTED]: 'Connecté',
    [PlayerStatus.DISCONNECTED]: 'Déconnecté',
    [PlayerStatus.SURRENDERED]: 'Abandonné',
    [PlayerStatus.FINISHED]: 'Arrivé',
  }[status] ?? status);
}
</script>

<style scoped>
.player-list-enter-active, .player-list-leave-active { transition: all 0.2s ease; }
.player-list-enter-from, .player-list-leave-to { opacity: 0; transform: translateX(-8px); }
</style>
