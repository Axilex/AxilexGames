<template>
  <GameEntryPage
    title="Snap Avis"
    subtitle="Une photo, un mot — marque si tu penses comme les autres"
    gradient-classes="from-violet-500 to-pink-500"
    icon-shadow-class="shadow-violet-200"
    lobby-route-name="snap-avis-lobby"
    :error="store.error"
    :room="store.room"
    :pseudo-maxlength="16"
    :initial-pseudo="session.pseudo"
    @join="handleJoin"
    @create="handleCreate"
  >
    <template #icon>
      <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </template>
  </GameEntryPage>
</template>

<script setup lang="ts">
import { snapAvisSocket } from '../services/snap-avis.service';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';
import { useSnapAvisStore } from '../stores/useSnapAvisStore';
import GameEntryPage from '@/shared/components/ui/GameEntryPage.vue';

const session = useSnapAvisSessionStore();
const store = useSnapAvisStore();

function handleJoin(code: string, pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, code);
  snapAvisSocket.join(code, pseudo);
}

function handleCreate(pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, '');
  snapAvisSocket.create(pseudo);
}
</script>
