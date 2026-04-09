<template>
  <div class="flex flex-col gap-1.5">
    <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
      Joueurs
    </p>
    <div
      v-for="player in players"
      :key="player.pseudo"
      :class="[
        'flex flex-col gap-0.5 px-3 py-2 rounded-lg text-xs transition-colors border',
        player.pseudo === currentPseudo
          ? 'bg-amber-50 border-amber-200'
          : 'bg-stone-50 border-stone-100',
      ]"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="font-semibold text-stone-800 truncate">{{ player.pseudo }}</span>
        <span :class="['shrink-0 font-bold text-xs', hopColor(player.status)]">
          {{ player.hopCount }} clic{{ player.hopCount > 1 ? 's' : '' }}
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <span :class="['h-1.5 w-1.5 rounded-full shrink-0', dotColor(player.status)]" />
        <span class="text-stone-500 truncate">
          {{
            player.status === 'SURRENDERED' ? 'Abandonné'
            : player.status === 'FINISHED' ? '🏆 Arrivé !'
              : player.status === 'DISCONNECTED' ? 'Déconnecté'
                : decodeURIComponent(player.currentSlug).replace(/_/g, ' ') || '—'
          }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerProgressDTO } from '@wiki-race/shared';

defineProps<{ players: PlayerProgressDTO[]; currentPseudo: string }>();

function dotColor(status: string): string {
  return ({ CONNECTED: 'bg-emerald-500', DISCONNECTED: 'bg-amber-400', SURRENDERED: 'bg-red-400', FINISHED: 'bg-amber-500' }[status] ?? 'bg-stone-400');
}
function hopColor(status: string): string {
  return ({ CONNECTED: 'text-stone-600', SURRENDERED: 'text-red-500', FINISHED: 'text-amber-600', DISCONNECTED: 'text-amber-500' }[status] ?? 'text-stone-500');
}
</script>
