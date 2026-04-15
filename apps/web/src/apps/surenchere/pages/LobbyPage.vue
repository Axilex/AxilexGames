<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-stone-900">🏆 Surenchère — Salon</h1>
        <BaseButton variant="ghost" size="sm" @click="onLeave">Quitter</BaseButton>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 flex flex-col gap-4">
        <RoomCodeDisplay :code="store.room?.code ?? ''" />
        <ShareLink :share-url="shareUrl" />
        <PlayerList :players="store.room?.players ?? []" :my-socket-id="store.mySocketId" />
      </div>

      <div class="flex flex-col gap-4">
        <GameSettings
          v-if="store.isHost"
          :settings="store.room?.settings"
          :disabled="!canStart"
          @start="onStart"
          @update:settings="onUpdateSettings"
        />
        <div
          v-else
          class="bg-white rounded-2xl border border-stone-200 p-5 text-sm text-stone-500 text-center"
        >
          En attente du host…
        </div>
        <RulesCard />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import RoomCodeDisplay from '@/shared/components/ui/RoomCodeDisplay.vue';
import ShareLink from '@/shared/components/ui/ShareLink.vue';
import PlayerList from '../components/lobby/PlayerList.vue';
import GameSettings from '../components/lobby/GameSettings.vue';
import { useSurenchereStore } from '../stores/useSurenchereStore';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { surenchereSocket } from '../services/surenchere.service';
import RulesCard from '../components/RulesCard.vue';

const router = useRouter();
const store = useSurenchereStore();
const session = useSurenchereSessionStore();

const canStart = computed(() => (store.room?.players.length ?? 0) >= 2);
const shareUrl = computed(
  () => `${window.location.origin}/surenchere?code=${store.room?.code ?? ''}`,
);

onMounted(() => {
  // If we have a stored session but no room loaded, try to (re)join.
  if (!store.room && session.roomCode && session.pseudo) {
    surenchereSocket.join(session.roomCode, session.pseudo);
  }
});

function onStart(): void {
  surenchereSocket.start();
}

function onUpdateSettings(settings: { totalRounds: number; startBid: number }): void {
  surenchereSocket.updateSettings(settings);
}

function onLeave(): void {
  surenchereSocket.leave();
  session.clearSession();
  store.reset();
  router.push({ name: 'surenchere' });
}
</script>
