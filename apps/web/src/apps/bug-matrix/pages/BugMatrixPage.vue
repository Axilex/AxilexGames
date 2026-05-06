<template>
  <GameEntryPage
    title="Bug dans la Matrix"
    subtitle="Tout le monde bugge… sauf une personne normale"
    gradient-classes="from-emerald-500 to-cyan-500"
    icon-shadow-class="shadow-emerald-200"
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
          d="M9.5 2A2.5 2.5 0 007 4.5v.5h-.5A2.5 2.5 0 004 7.5v.4A3 3 0 003 10.5v.5a3 3 0 00.5 1.65A3 3 0 003 14.3v.7a3 3 0 002 2.83V18a2.5 2.5 0 002.5 2.5h.5a2.5 2.5 0 002 1.5h0a2.5 2.5 0 002.5-2.5h0a2.5 2.5 0 002-1V18a2.5 2.5 0 002.5-2.5v-.4a3 3 0 002-2.83v-.7a3 3 0 00-.5-1.65A3 3 0 0021 8.5v-1A2.5 2.5 0 0018.5 5H18v-.5A2.5 2.5 0 0015.5 2h-1A2.5 2.5 0 0012 3.5 2.5 2.5 0 009.5 2z"
        />
      </svg>
    </template>
  </GameEntryPage>
</template>

<script setup lang="ts">
import { bugMatrixSocket } from '../services/bug-matrix.service';
import { useBugMatrixSessionStore } from '@/shared/stores/useBugMatrixSessionStore';
import { useBugMatrixStore } from '../stores/useBugMatrixStore';
import GameEntryPage from '@/shared/components/ui/GameEntryPage.vue';

const session = useBugMatrixSessionStore();
const store = useBugMatrixStore();

function handleJoin(code: string, pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, code);
  bugMatrixSocket.join(code, pseudo);
}

function handleCreate(pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, '');
  bugMatrixSocket.create(pseudo);
}
</script>
