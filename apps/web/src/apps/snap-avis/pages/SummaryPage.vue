<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
      <div class="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-foreground">📸 Snap Avis — Résultats</h1>
        <BaseButton variant="ghost" size="sm" @click="onLeave">Quitter</BaseButton>
      </div>
    </header>

    <main class="flex-1 max-w-2xl mx-auto w-full px-4 py-8 flex flex-col gap-8">
      <!-- Podium -->
      <section class="flex flex-col gap-4">
        <p class="text-xs font-semibold text-foreground-subtle uppercase tracking-widest text-center">
          Classement final
        </p>
        <RankPodium :rankings="store.rankings" />
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
import RankPodium from '../components/summary/Podium.vue';
import { useSnapAvisStore } from '../stores/useSnapAvisStore';
import { useSnapAvisSessionStore } from '@/shared/stores/useSnapAvisSessionStore';
import { snapAvisSocket } from '../services/snap-avis.service';

const router = useRouter();
const store = useSnapAvisStore();
const session = useSnapAvisSessionStore();

function onReplay(): void {
  snapAvisSocket.reset();
  void router.push({ name: 'snap-avis-lobby' });
}

function onLeave(): void {
  snapAvisSocket.leave();
  session.clearSession();
  store.reset();
  void router.push({ name: 'home' });
}
</script>
