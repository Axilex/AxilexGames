<template>
  <GameEntryPage
    title="Surenchère"
    subtitle="Défiez-vous à coups d'enchères"
    gradient-classes="from-violet-500 to-purple-600"
    icon-shadow-class="shadow-violet-200"
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
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    </template>
  </GameEntryPage>
</template>

<script setup lang="ts">
import { surenchereSocket } from '../services/surenchere.service';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { useSurenchereStore } from '../stores/useSurenchereStore';
import GameEntryPage from '@/shared/components/ui/GameEntryPage.vue';

const session = useSurenchereSessionStore();
const store = useSurenchereStore();

function handleJoin(code: string, pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, code);
  surenchereSocket.join(code, pseudo);
}

function handleCreate(pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, '');
  surenchereSocket.create(pseudo);
}
</script>
