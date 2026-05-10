<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-lg font-bold text-foreground">🧠 Bug dans la Matrix — Salon</h1>
        <BaseButton variant="ghost" size="sm" @click="onLeave">Quitter</BaseButton>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 flex flex-col gap-4">
        <RoomCodeDisplay :code="store.room?.code ?? ''" />
        <ShareLink :share-url="shareUrl" />
        <PlayerList :players="store.room?.players ?? []" :my-pseudo="store.myPseudo" show-score />
      </div>

      <div class="flex flex-col gap-4">
        <div
          v-if="store.isHost"
          class="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4"
        >
          <h2 class="text-base font-bold text-foreground">Réglages</h2>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-semibold text-foreground-muted">Nombre de manches</span>
            <select v-model.number="local.roundCount" class="rounded-lg border-border px-3 py-2">
              <option v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 10]" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-semibold text-foreground-muted">Discussion (sec.)</span>
            <select v-model.number="local.discussionMs" class="rounded-lg border-border px-3 py-2">
              <option :value="60_000">60</option>
              <option :value="120_000">120</option>
              <option :value="180_000">180</option>
              <option :value="240_000">240</option>
              <option :value="300_000">300</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-semibold text-foreground-muted">Rotation question (sec.)</span>
            <select v-model.number="local.questionRotationMs" class="rounded-lg border-border px-3 py-2">
              <option :value="20_000">20</option>
              <option :value="30_000">30</option>
              <option :value="45_000">45</option>
              <option :value="60_000">60</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-semibold text-foreground-muted">Vote (sec.)</span>
            <select v-model.number="local.voteMs" class="rounded-lg border-border px-3 py-2">
              <option :value="30_000">30</option>
              <option :value="60_000">60</option>
              <option :value="90_000">90</option>
              <option :value="120_000">120</option>
            </select>
          </label>
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-semibold text-foreground-muted">Score à atteindre</span>
            <select v-model.number="local.targetScore" class="rounded-lg border-border px-3 py-2">
              <option v-for="n in [5, 8, 10, 12, 15, 20]" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
          <BaseButton :disabled="!canStart" @click="onStart">
            {{ canStart ? 'Démarrer la partie' : 'Min. 3 joueurs' }}
          </BaseButton>
        </div>
        <div
          v-else
          class="bg-card rounded-2xl border border-border p-5 text-sm text-foreground-muted text-center"
        >
          En attente du host…
        </div>
        <RulesCardBugMatrix />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { BugMatrixSettings } from '@wiki-race/shared';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import RoomCodeDisplay from '@/shared/components/ui/RoomCodeDisplay.vue';
import ShareLink from '@/shared/components/ui/ShareLink.vue';
import PlayerList from '@/shared/components/ui/PlayerList.vue';
import { useBugMatrixStore } from '../stores/useBugMatrixStore';
import { useBugMatrixSessionStore } from '@/shared/stores/useBugMatrixSessionStore';
import { bugMatrixSocket } from '../services/bug-matrix.service';
import RulesCardBugMatrix from '../components/RulesCardBugMatrix.vue';

const router = useRouter();
const store = useBugMatrixStore();
const session = useBugMatrixSessionStore();

const local = reactive<BugMatrixSettings>({
  roundCount: 3,
  discussionMs: 180_000,
  questionRotationMs: 30_000,
  voteMs: 60_000,
  targetScore: 10,
});

watch(
  () => store.room?.settings,
  (s) => {
    if (s) Object.assign(local, s);
  },
  { immediate: true },
);

const canStart = computed(() => (store.room?.players.length ?? 0) >= 3);
const shareUrl = computed(
  () => `${window.location.origin}/bug-matrix?code=${store.room?.code ?? ''}`,
);

onMounted(() => {
  if (!store.room && session.roomCode && session.pseudo) {
    bugMatrixSocket.join(session.roomCode, session.pseudo, session.sessionToken || undefined);
  }
});

function onStart(): void {
  bugMatrixSocket.start({ ...local });
}

function onLeave(): void {
  bugMatrixSocket.leave();
  session.clearSession();
  store.reset();
  router.push({ name: 'home' });
}
</script>
