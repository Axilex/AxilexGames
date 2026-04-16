<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-stone-900">🔄 Télépathie — Résultats</h1>
        <BaseButton variant="ghost" size="sm" @click="onLeave">Quitter</BaseButton>
      </div>
    </header>

    <main class="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      <!-- Podium -->
      <section class="flex flex-col gap-4">
        <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest text-center">
          Classement final
        </p>
        <TelepathiePodium :rankings="store.rankings" />
      </section>

      <!-- Historique -->
      <section v-if="store.room?.mancheResults.length">
        <RoundHistory :results="store.room.mancheResults" />
      </section>

      <!-- Actions -->
      <div class="flex flex-col gap-3 max-w-sm mx-auto w-full">
        <BaseButton v-if="store.isHost" class="w-full" @click="onReplay"> Rejouer → </BaseButton>
        <BaseButton variant="secondary" class="w-full" @click="onLeave"> Quitter </BaseButton>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import TelepathiePodium from '../components/summary/Podium.vue';
import RoundHistory from '../components/summary/RoundHistory.vue';
import { useTelepathieStore } from '../stores/useTelepathieStore';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';
import { telepathieSocket } from '../services/telepathie.service';

const router = useRouter();
const store = useTelepathieStore();
const session = useTelepathieSessionStore();

function onReplay(): void {
  telepathieSocket.reset();
  void router.push({ name: 'telepathie-lobby' });
}

function onLeave(): void {
  telepathieSocket.leave();
  session.clearSession();
  store.reset();
  void router.push({ name: 'home' });
}
</script>
