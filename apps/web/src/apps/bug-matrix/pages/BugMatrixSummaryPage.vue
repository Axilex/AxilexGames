<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-stone-900">🧠 Bug dans la Matrix — Fin de partie</h1>
      </div>
    </header>

    <main class="flex-1 max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
      <ol class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-3">
        <li
          v-for="entry in store.finalRanking"
          :key="entry.pseudo"
          :class="[
            'flex items-center justify-between p-3 rounded-xl',
            entry.rank === 1 ? 'bg-amber-50 border border-amber-200' : 'border border-stone-100',
          ]"
        >
          <div class="flex items-center gap-3">
            <span
              :class="[
                'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                entry.rank === 1
                  ? 'bg-amber-400 text-white'
                  : entry.rank === 2
                    ? 'bg-stone-300 text-white'
                    : entry.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-stone-100 text-stone-500',
              ]"
            >
              {{ entry.rank }}
            </span>
            <span class="font-bold text-stone-900">{{ entry.pseudo }}</span>
          </div>
          <span class="text-emerald-600 font-bold">{{ entry.score }} pts</span>
        </li>
      </ol>

      <div class="flex gap-3 justify-center flex-wrap">
        <BaseButton v-if="store.isHost" @click="onReplay">Rejouer</BaseButton>
        <BaseButton variant="secondary" @click="onLeave">Quitter</BaseButton>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { useBugMatrixStore } from '../stores/useBugMatrixStore';
import { useBugMatrixSessionStore } from '@/shared/stores/useBugMatrixSessionStore';
import { bugMatrixSocket } from '../services/bug-matrix.service';

const router = useRouter();
const store = useBugMatrixStore();
const session = useBugMatrixSessionStore();

function onReplay(): void {
  bugMatrixSocket.reset();
  router.push({ name: 'bug-matrix-lobby' });
}

function onLeave(): void {
  bugMatrixSocket.leave();
  session.clearSession();
  store.reset();
  router.push({ name: 'home' });
}
</script>
