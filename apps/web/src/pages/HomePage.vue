<template>
  <div class="min-h-screen bg-stone-100 flex flex-col">
    <AppNav />

    <main class="flex-1 max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
      <!-- Hero -->
      <section class="text-center flex flex-col items-center gap-5 py-8">
        <div
          class="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-700 uppercase tracking-widest"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          {{ games.filter((g) => g.live).length }} jeu{{
            games.filter((g) => g.live).length > 1 ? 'x' : ''
          }}
          disponible{{ games.filter((g) => g.live).length > 1 ? 's' : '' }}
        </div>
        <h1 class="text-5xl sm:text-6xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Joue. Gagne.<br />
          <span class="text-amber-500">Recommence.</span>
        </h1>
        <p class="text-stone-500 text-lg max-w-md leading-relaxed">
          Des mini-jeux multijoueurs directement dans le navigateur. Aucune installation.
        </p>
      </section>

      <!-- Quick play -->
      <section class="flex flex-col gap-5">
        <SectionTitle title="Création de lobby" />
        <ErrorToast :message="lobbyStore.error" />
        <div class="max-w-sm mx-auto w-full flex flex-col gap-5">
          <!-- Shared pseudo -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-sm font-semibold text-stone-700">Ton pseudo</span>
              <span class="text-xs text-stone-400">· commun à tous les salons</span>
            </div>
            <BaseInput
              v-model="pseudo"
              placeholder="ex : Alice"
              :maxlength="16"
              :error="pseudoError"
              size="lg"
              @enter="joinLobby"
            />
          </div>

        <!-- Join -->
        <div
          :class="[
            'bg-white rounded-2xl p-6 border shadow-sm flex flex-col gap-4',
            hasInviteCode ? 'bg-amber-50 border-amber-300 shadow-amber-100' : 'border-stone-200',
          ]"
        >
          <div class="flex items-center gap-2">
            <span v-if="hasInviteCode" class="text-lg leading-none">🎉</span>
            <h2 :class="['text-base font-semibold', hasInviteCode ? 'text-amber-900' : 'text-stone-800']">
              {{ hasInviteCode ? 'Vous avez été invité !' : 'Rejoindre un salon' }}
            </h2>
          </div>
          <div v-if="hasInviteCode" class="bg-white rounded-xl border border-amber-200 px-4 py-3 text-center">
            <span class="text-2xl font-bold tracking-[0.3em] font-mono text-stone-900">{{ joinCode }}</span>
          </div>
          <BaseInput
            v-model="joinCode"
            :label="hasInviteCode ? 'Modifier le code' : 'Code du salon'"
            placeholder="ex : ABCDEF"
            :maxlength="6"
            :error="joinCodeError"
            class="font-mono uppercase"
            @enter="joinLobby"
          />
          <BaseButton
            :variant="hasInviteCode ? 'primary' : 'secondary'"
            :loading="joining"
            class="w-full"
            @click="joinLobby"
          >
            Rejoindre →
          </BaseButton>
        </div>

        <!-- Divider -->
        <div v-if="!hasInviteCode" class="flex items-center gap-3">
          <div class="flex-1 h-px bg-stone-200" />
          <span class="text-xs text-stone-400 font-medium">ou</span>
          <div class="flex-1 h-px bg-stone-200" />
        </div>

        <!-- Create -->
        <div v-if="!hasInviteCode" class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-4">
          <h2 class="text-base font-semibold text-stone-800">Créer un salon</h2>
          <BaseButton :loading="creating" class="w-full" @click="createLobby">
            Créer un salon →
          </BaseButton>
        </div>
        <div v-else class="text-center">
          <button
            class="text-xs text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors"
            :disabled="creating"
            @click="createLobby"
          >
            {{ creating ? 'Création…' : 'ou créer un nouveau salon' }}
          </button>
        </div>
        </div>
      </section>

      <!-- Games grid -->
      <section class="flex flex-col gap-5">
        <SectionTitle title="Jeux" />

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <GameCard v-for="game in games" :key="game.name" v-bind="game" />
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="border-t border-stone-200 bg-white mt-4">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <span class="text-xs font-semibold text-stone-900"
          >Axilex<span class="text-amber-500">Games</span></span
        >
        <span class="text-xs text-stone-400">{{ new Date().getFullYear() }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import AppNav from '@/shared/components/ui/AppNav.vue';
import GameCard from '@/shared/components/ui/GameCard.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import ErrorToast from '@/shared/components/ui/ErrorToast.vue';
import SectionTitle from '@/shared/components/ui/SectionTitle.vue';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';
import { useCommonLobbyStore } from '@/apps/common-lobby/stores/useCommonLobbyStore';
import { lobbySocket } from '@/apps/common-lobby/services/lobby.service';

const commonSession = useCommonSessionStore();
const lobbyStore = useCommonLobbyStore();
const pseudo = ref(commonSession.pseudo);
const pseudoError = ref('');
const joinCode = ref('');
const joinCodeError = ref('');
const creating = ref(false);
const joining = ref(false);

const params = new URLSearchParams(window.location.search);
const urlCode = params.get('code');
const urlAutoJoin = params.get('autoJoin');
if (urlCode) joinCode.value = urlCode.toUpperCase();
const hasInviteCode = !!urlCode;

onMounted(() => {
  if (urlCode && urlAutoJoin && commonSession.pseudo) {
    joinLobby();
  }
});

watch(
  () => lobbyStore.room,
  (room) => {
    if (room) {
      creating.value = false;
      joining.value = false;
    }
  },
);
watch(
  () => lobbyStore.error,
  () => {
    creating.value = false;
    joining.value = false;
  },
);

function joinLobby(): void {
  pseudoError.value = '';
  joinCodeError.value = '';
  if (!pseudo.value.trim()) {
    pseudoError.value = 'Entre un pseudo.';
    return;
  }
  if (joinCode.value.trim().length < 6) {
    joinCodeError.value = 'Le code doit faire 6 caractères.';
    return;
  }
  lobbyStore.clearError();
  joining.value = true;
  commonSession.setSession(pseudo.value.trim(), joinCode.value.trim().toUpperCase());
  lobbySocket.join(joinCode.value.trim().toUpperCase(), pseudo.value.trim());
}

function createLobby(): void {
  pseudoError.value = '';
  if (!pseudo.value.trim()) {
    pseudoError.value = 'Entre un pseudo.';
    return;
  }
  lobbyStore.clearError();
  creating.value = true;
  commonSession.setSession(pseudo.value.trim(), '');
  lobbySocket.create(pseudo.value.trim());
}

const games = [
  {
    name: 'WikiRace',
    description:
      'Navigue de page en page sur Wikipédia et arrive à destination avant tes adversaires.',
    tags: ['Multijoueur', 'Cerveau'],
    gradient: 'from-amber-400 to-orange-500',
    icon: 'book',
    to: '/wikirace',
    live: true,
    players: '2–8 joueurs',
  },
  {
    name: 'Surenchère',
    description:
      "Défiez-vous à coups d'enchères ! Citez plus que les autres… ou perdez des points.",
    tags: ['Multijoueur', 'Culture', 'Rapidité'],
    gradient: 'from-amber-400 to-orange-500',
    icon: 'trophy',
    to: '/surenchere',
    live: true,
    players: '2–8 joueurs',
  },
  {
    name: '???',
    description: 'Un nouveau défi arrive bientôt. Reste connecté.',
    tags: ['Bientôt'],
    gradient: 'from-stone-300 to-stone-400',
    icon: 'soon',
    to: null,
    live: false,
    players: null,
  },
];
</script>
