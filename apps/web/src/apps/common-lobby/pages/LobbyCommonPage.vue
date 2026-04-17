<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-stone-900">🎮 AxilexGames — Salon</h1>
        <BaseButton variant="ghost" size="sm" @click="onLeave">Quitter</BaseButton>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 flex flex-col gap-4">
        <RoomCodeDisplay :code="store.room?.code ?? ''" />
        <ShareLink :share-url="shareUrl" />

        <PlayerList :players="store.room?.players ?? []" :my-pseudo="store.myPseudo" />
      </div>

      <div class="flex flex-col gap-4">
        <!-- Game choice -->
        <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4">
          <template v-if="store.room?.status === 'IN_GAME'">
            <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Partie en cours
            </span>
            <p class="text-sm text-stone-500 text-center">
              La partie vient de se terminer. Choisissez un nouveau jeu pour rejouer.
            </p>
            <BaseButton v-if="store.isHost" class="w-full" @click="onResetGame">
              Choisir un nouveau jeu
            </BaseButton>
            <p v-else class="text-xs text-stone-400 text-center">En attente du host…</p>
          </template>

          <template v-else>
            <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Choix du jeu
            </span>

            <div class="flex flex-col gap-2">
              <button
                v-for="game in GAMES"
                :key="game.id"
                :disabled="!store.isHost"
                :class="[
                  'rounded-xl border px-4 py-3 text-left transition-all',
                  store.gameChoice === game.id
                    ? game.colorScheme.lobbySelected
                    : ['border-stone-200 bg-stone-50', game.colorScheme.lobbyHover],
                  !store.isHost ? 'cursor-default' : 'cursor-pointer',
                ]"
                @click="store.isHost && onChooseGame(game.id as NonNullable<GameChoice>)"
              >
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{ game.icon }}</span>
                  <span class="font-semibold text-stone-900 text-sm">{{ game.name }}</span>
                </div>
                <p class="text-xs text-stone-500 mt-1">{{ game.description }}</p>
              </button>
            </div>

            <p v-if="!store.isHost" class="text-xs text-stone-400 text-center">
              En attente du choix du host…
            </p>

            <BaseButton
              v-if="store.isHost"
              :disabled="!store.canStart"
              class="w-full"
              @click="onStart"
            >
              Lancer la partie →
            </BaseButton>
            <p
              v-if="store.isHost && store.startBlockedReason"
              class="text-xs text-stone-400 text-center"
            >
              {{ store.startBlockedReason }}
            </p>
          </template>
        </div>

        <ErrorToast :message="store.error" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed, onMounted } from 'vue';
import type { GameChoice } from '@wiki-race/shared';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import RoomCodeDisplay from '@/shared/components/ui/RoomCodeDisplay.vue';
import ShareLink from '@/shared/components/ui/ShareLink.vue';
import ErrorToast from '@/shared/components/ui/ErrorToast.vue';
import PlayerList from '@/shared/components/ui/PlayerList.vue';
import { GAME_COLOR_SCHEMES } from '@/shared/constants/game-colors';
import { useCommonLobbyStore } from '../stores/useCommonLobbyStore';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';
import { lobbySocket } from '../services/lobby.service';

const GAMES = [
  {
    id: 'wikirace',
    icon: '🌐',
    name: 'WikiRace',
    description: 'Naviguez de page en page sur Wikipédia.',
    colorScheme: GAME_COLOR_SCHEMES.amber,
  },
  {
    id: 'surenchere',
    icon: '🏆',
    name: 'Surenchère',
    description: 'Enchérissez et bluffez sur vos connaissances.',
    colorScheme: GAME_COLOR_SCHEMES.blue,
  },
  {
    id: 'snap-avis',
    icon: '📸',
    name: 'Snap Avis',
    description: 'Décrivez une image en un mot, trouvez les mêmes.',
    colorScheme: GAME_COLOR_SCHEMES.violet,
  },
  {
    id: 'telepathie',
    icon: '🧠',
    name: 'Télépathie',
    description: 'Synchronisez vos mots avec les autres joueurs.',
    colorScheme: GAME_COLOR_SCHEMES.teal,
  },
];

const router = useRouter();
const store = useCommonLobbyStore();
const session = useCommonSessionStore();
const shareUrl = computed(() =>
  store.room?.code ? `${window.location.origin}/?code=${store.room.code}` : '',
);

onMounted(() => {
  // Re-register with the server only when our store doesn't already reflect this room
  // (refresh, return from game). Skip when we just landed here from `lobby:create` —
  // re-emitting `lobby:join` would just trigger a redundant rebind + broadcast.
  if (!session.roomCode || !session.pseudo) return;
  if (store.room?.code === session.roomCode && store.room?.status === 'WAITING') return;
  lobbySocket.join(session.roomCode, session.pseudo);
});

function onChooseGame(game: NonNullable<GameChoice>): void {
  if (store.gameChoice === game) {
    lobbySocket.clearGame();
  } else {
    lobbySocket.chooseGame(game);
  }
}

function onStart(): void {
  lobbySocket.start();
}

function onResetGame(): void {
  lobbySocket.reset();
}

function onLeave(): void {
  lobbySocket.leave();
  session.clearSession();
  store.reset();
  router.push({ name: 'home' });
}
</script>
