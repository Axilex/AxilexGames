<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-stone-900">📸 Snap Avis — Salon</h1>
        <BaseButton variant="ghost" size="sm" @click="onLeave">Quitter</BaseButton>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 flex flex-col gap-4">
        <RoomCodeDisplay :code="store.room?.code ?? ''" />
        <ShareLink :share-url="shareUrl" />

        <PlayerList
          :players="store.room?.players ?? []"
          :my-pseudo="store.myPseudo"
          :max-players="8"
          count-connected-only
          show-me-label
        />
      </div>

      <div class="flex flex-col gap-4">
        <!-- Settings (host only) -->
        <div
          v-if="store.isHost"
          class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4"
        >
          <p class="text-xs font-semibold text-stone-500 uppercase tracking-widest">Réglages</p>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-stone-600">Nombre de manches</label>
            <select
              v-model.number="totalRounds"
              class="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option v-for="n in [4, 6, 8, 10, 12]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-stone-600">Temps d'écriture</label>
            <select
              v-model.number="writingDurationSec"
              class="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option :value="8">8 secondes</option>
              <option :value="10">10 secondes</option>
              <option :value="15">15 secondes</option>
              <option :value="20">20 secondes</option>
            </select>
          </div>

          <BaseButton :disabled="!canStart" class="w-full" @click="onStart">
            Lancer la partie →
          </BaseButton>
          <p v-if="!canStart" class="text-xs text-stone-400 text-center">
            Il faut au moins 2 joueurs.
          </p>
        </div>

        <div
          v-else
          class="bg-white rounded-2xl border border-stone-200 p-5 text-sm text-stone-500 text-center"
        >
          En attente de l'hôte…
        </div>

        <RulesCard />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import RoomCodeDisplay from '@/shared/components/ui/RoomCodeDisplay.vue';
import ShareLink from '@/shared/components/ui/ShareLink.vue';
import PlayerList from '@/shared/components/ui/PlayerList.vue';
import { useSnapAvisStore } from '../stores/useSnapAvisStore';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';
import { snapAvisSocket } from '../services/snap-avis.service';
import RulesCard from '../components/RulesCard.vue';

const router = useRouter();
const store = useSnapAvisStore();
const session = useSnapAvisSessionStore();

const totalRounds = ref(store.room?.settings.totalRounds ?? 8);
const writingDurationSec = ref((store.room?.settings.writingDurationMs ?? 10000) / 1000);

const canStart = computed(
  () => (store.room?.players.filter((p) => p.status === 'CONNECTED').length ?? 0) >= 2,
);

const shareUrl = computed(
  () => `${window.location.origin}/snap-avis?code=${store.room?.code ?? ''}`,
);

onMounted(() => {
  if (!store.room && session.roomCode && session.pseudo) {
    snapAvisSocket.join(session.roomCode, session.pseudo);
  }
});

function onStart(): void {
  snapAvisSocket.start({
    totalRounds: totalRounds.value,
    writingDurationMs: writingDurationSec.value * 1000,
  });
}

function onLeave(): void {
  snapAvisSocket.leave();
  session.clearSession();
  store.reset();
  void router.push({ name: 'home' });
}
</script>
