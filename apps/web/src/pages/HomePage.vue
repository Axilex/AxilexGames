<template>
  <div class="min-h-screen bg-stone-100 flex flex-col">
    <AppNav />

    <main class="flex-1 max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
      <!-- Hero -->
      <section class="text-center flex flex-col items-center gap-4 py-8">
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

      <!-- Games grid -->
      <section class="flex flex-col gap-5">
        <div class="flex items-center gap-4">
          <h2 class="text-xs font-bold text-stone-400 uppercase tracking-widest shrink-0">Jeux</h2>
          <div class="flex-1 h-px bg-stone-200" />
        </div>

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
import AppNav from '@/shared/components/ui/AppNav.vue';
import GameCard from '@/shared/components/ui/GameCard.vue';

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
    name: '???',
    description: 'Un nouveau défi arrive bientôt. Reste connecté.',
    tags: ['Bientôt'],
    gradient: 'from-stone-300 to-stone-400',
    icon: 'soon',
    to: null,
    live: false,
    players: null,
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
