<template>
  <div class="bg-card rounded-2xl border border-border p-5 flex flex-col gap-3">
    <p class="text-xs font-semibold uppercase tracking-widest text-foreground-muted">
      Joueurs ({{ countLabel }})
    </p>
    <TransitionGroup name="player-list" tag="ul" class="flex flex-col gap-2">
      <li
        v-for="player in players"
        :key="player.pseudo"
        :class="[
          'flex items-center gap-2.5 rounded-lg border px-3 py-2',
          player.pseudo === myPseudo
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            : 'bg-surface-muted border-border',
        ]"
      >
        <span :class="['w-2 h-2 rounded-full shrink-0', dotClass(player.status)]" />
        <span class="flex-1 text-sm font-medium text-foreground truncate">{{ player.pseudo }}</span>
        <span
          v-if="showMeLabel && player.pseudo === myPseudo"
          class="text-[10px] font-medium text-amber-600 dark:text-amber-300 shrink-0"
          aria-hidden="true"
          >(toi)</span
        >
        <span v-if="showMeLabel && player.pseudo === myPseudo" class="sr-only"> (vous)</span>
        <span
          v-if="player.isHost"
          class="text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200 px-1.5 py-0.5 rounded"
        >
          Hôte
        </span>
        <span
          v-if="showScore && typeof player.score === 'number'"
          class="text-sm font-bold text-foreground-muted tabular-nums"
        >
          {{ player.score }}
        </span>
        <span
          v-else-if="showFullStatus && STATUS_BADGE[player.status]"
          :class="[
            'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            STATUS_BADGE[player.status]?.cls,
          ]"
        >
          {{ STATUS_BADGE[player.status]?.label }}
        </span>
      </li>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PlayerStatus } from '@wiki-race/shared';

interface PlayerLike {
  pseudo: string;
  isHost: boolean;
  status: PlayerStatus;
  score?: number;
}

const props = withDefaults(
  defineProps<{
    players: PlayerLike[];
    myPseudo?: string;
    maxPlayers?: number;
    countConnectedOnly?: boolean;
    showScore?: boolean;
    showFullStatus?: boolean;
    showMeLabel?: boolean;
  }>(),
  {
    myPseudo: '',
    maxPlayers: undefined,
    countConnectedOnly: false,
    showScore: false,
    showFullStatus: false,
    showMeLabel: false,
  },
);

const playerCount = computed(() =>
  props.countConnectedOnly
    ? props.players.filter((p) => p.status === PlayerStatus.CONNECTED).length
    : props.players.length,
);

const countLabel = computed(() =>
  props.maxPlayers ? `${playerCount.value}/${props.maxPlayers}` : `${playerCount.value}`,
);

function dotClass(status: PlayerStatus): string {
  return status === PlayerStatus.CONNECTED
    ? 'bg-emerald-500'
    : 'bg-foreground-subtle';
}

const STATUS_BADGE: Partial<Record<PlayerStatus, { label: string; cls: string }>> = {
  [PlayerStatus.CONNECTED]: {
    label: 'Connecté',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  [PlayerStatus.DISCONNECTED]: {
    label: 'Déconnecté',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200',
  },
  [PlayerStatus.SURRENDERED]: {
    label: 'Abandonné',
    cls: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  },
  [PlayerStatus.FINISHED]: {
    label: 'Arrivé',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200',
  },
};
</script>

<style scoped>
.player-list-enter-active,
.player-list-leave-active {
  transition: all 0.2s ease;
}
.player-list-enter-from,
.player-list-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
