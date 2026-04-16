<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-stone-900">🔄 Télépathie — Salon</h1>
        <BaseButton variant="ghost" size="sm" @click="onLeave">Quitter</BaseButton>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 flex flex-col gap-4">
        <RoomCodeDisplay :code="store.room?.code ?? ''" />
        <ShareLink :share-url="shareUrl" />

        <!-- Liste des joueurs -->
        <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-3">
          <p class="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            Joueurs ({{ connectedCount }}/8)
          </p>
          <ul class="flex flex-col gap-2">
            <li
              v-for="player in store.room?.players ?? []"
              :key="player.socketId"
              class="flex items-center gap-3"
            >
              <span
                :class="[
                  'w-2 h-2 rounded-full shrink-0',
                  player.status === 'CONNECTED' ? 'bg-emerald-400' : 'bg-stone-300',
                ]"
              />
              <span class="text-sm font-medium text-stone-800">{{ player.pseudo }}</span>
              <span
                v-if="player.isHost"
                class="ml-auto text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"
              >
                Hôte
              </span>
              <span
                v-if="player.socketId === store.mySocketId"
                class="text-[10px] text-stone-400 ml-auto"
              >
                (toi)
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Réglages (hôte uniquement) -->
        <div
          v-if="store.isHost"
          class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4"
        >
          <p class="text-xs font-semibold text-stone-500 uppercase tracking-widest">Réglages</p>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-stone-600">Nombre de manches</label>
            <select
              v-model.number="settings.totalManches"
              class="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option v-for="n in [3, 5, 7, 10]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-stone-600">Sous-rounds max par manche</label>
            <select
              v-model.number="settings.maxSousRounds"
              class="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option v-for="n in [5, 8, 10, 15, 20]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-stone-600">Secondes par sous-round</label>
            <select
              v-model.number="settings.roundTimerSeconds"
              class="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option :value="15">15 s</option>
              <option :value="20">20 s</option>
              <option :value="30">30 s</option>
              <option :value="45">45 s</option>
              <option :value="60">60 s</option>
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
import { computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import RoomCodeDisplay from '@/shared/components/ui/RoomCodeDisplay.vue';
import ShareLink from '@/shared/components/ui/ShareLink.vue';
import { useTelepathieStore } from '../stores/useTelepathieStore';
import { useTelepathieSessionStore } from '@/shared/stores/useTelepathieSessionStore';
import { telepathieSocket } from '../services/telepathie.service';
import RulesCard from '../components/RulesCard.vue';

const router = useRouter();
const store = useTelepathieStore();
const session = useTelepathieSessionStore();

const settings = reactive({
  totalManches: store.room?.settings.totalManches ?? 5,
  maxSousRounds: store.room?.settings.maxSousRounds ?? 10,
  roundTimerSeconds: store.room?.settings.roundTimerSeconds ?? 30,
});

const canStart = computed(
  () => (store.room?.players.filter((p) => p.status === 'CONNECTED').length ?? 0) >= 2,
);
const connectedCount = computed(
  () => store.room?.players.filter((p) => p.status === 'CONNECTED').length ?? 0,
);
const shareUrl = computed(
  () => `${window.location.origin}/telepathie?code=${store.room?.code ?? ''}`,
);

onMounted(() => {
  if (!store.room && session.roomCode && session.pseudo) {
    telepathieSocket.join(session.roomCode, session.pseudo);
  }
});

function onStart(): void {
  telepathieSocket.start({ ...settings });
}

function onLeave(): void {
  telepathieSocket.leave();
  session.clearSession();
  store.reset();
  void router.push({ name: 'home' });
}
</script>
