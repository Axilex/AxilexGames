<template>
  <GameEntryPage
    title="WikiRace"
    subtitle="Course de page en page sur Wikipédia"
    gradient-classes="from-amber-400 to-orange-500"
    icon-shadow-class="shadow-amber-200"
    :error="lobbyStore.error"
    :room="lobbyStore.room"
    lobby-route-name="lobby"
    :pseudo-maxlength="20"
    :initial-pseudo="sessionStore.pseudo"
    @join="handleJoin"
    @create="handleCreate"
  >
    <template #icon>
      <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    </template>
  </GameEntryPage>
</template>

<script setup lang="ts">
import { useLobby } from '../composables/useLobby';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import GameEntryPage from '@/shared/components/ui/GameEntryPage.vue';

const { createRoom, joinRoom, lobbyStore } = useLobby();
const sessionStore = useSessionStore();

function handleJoin(code: string, pseudo: string): void {
  joinRoom(code, pseudo);
}

function handleCreate(pseudo: string): void {
  createRoom(pseudo);
}
</script>
