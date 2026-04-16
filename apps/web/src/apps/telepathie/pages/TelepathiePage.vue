<template>
  <GameEntryPage
    title="Télépathie"
    subtitle="Convergez vers le même mot en un minimum de rounds"
    gradient-classes="from-teal-500 to-cyan-500"
    icon-shadow-class="shadow-teal-200"
    lobby-route-name="telepathie-lobby"
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
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </template>
  </GameEntryPage>
</template>

<script setup lang="ts">
import { telepathieSocket } from '../services/telepathie.service';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';
import { useTelepathieStore } from '../stores/useTelepathieStore';
import GameEntryPage from '@/shared/components/ui/GameEntryPage.vue';

const session = useTelepathieSessionStore();
const store = useTelepathieStore();

function handleJoin(code: string, pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, code);
  telepathieSocket.join(code, pseudo);
}

function handleCreate(pseudo: string): void {
  store.clearError();
  session.setSession(pseudo, '');
  telepathieSocket.create(pseudo);
}
</script>
