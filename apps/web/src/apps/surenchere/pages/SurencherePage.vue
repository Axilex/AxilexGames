<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <AppNav />
    <main class="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div class="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-8 flex flex-col gap-6">
        <div class="flex flex-col gap-2 text-center">
          <div class="text-4xl">🏆</div>
          <h1 class="text-2xl font-bold text-stone-900">Surenchère</h1>
          <p class="text-sm text-stone-500">
            Défiez-vous à coups d'enchères. Citez plus que les autres… ou perdez des points.
          </p>
        </div>

        <BaseInput
          v-model="pseudo"
          label="Pseudo"
          placeholder="Ton pseudo"
          :maxlength="16"
          :error="pseudoError"
        />

        <BaseInput
          v-model="roomCode"
          label="Code de la room (optionnel)"
          placeholder="Laisser vide pour créer"
          :maxlength="6"
        />

        <div class="flex flex-col gap-2">
          <BaseButton :disabled="!pseudo" @click="onCreate">Créer une partie</BaseButton>
          <BaseButton variant="secondary" :disabled="!pseudo || !roomCode" @click="onJoin">
            Rejoindre
          </BaseButton>
        </div>

        <p v-if="store.error" class="text-sm text-red-600 text-center">{{ store.error }}</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppNav from '@/shared/components/ui/AppNav.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import { surenchereSocket } from '../services/surenchere.service';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { useSurenchereStore } from '../stores/useSurenchereStore';

const session = useSurenchereSessionStore();
const store = useSurenchereStore();

const pseudo = ref(session.pseudo);
const roomCode = ref('');
const pseudoError = ref('');

function onCreate(): void {
  if (!pseudo.value.trim()) {
    pseudoError.value = 'Pseudo requis';
    return;
  }
  session.setSession(pseudo.value.trim(), '');
  store.reset();
  surenchereSocket.create(pseudo.value.trim());
}

function onJoin(): void {
  if (!pseudo.value.trim() || !roomCode.value.trim()) return;
  session.setSession(pseudo.value.trim(), roomCode.value.trim().toUpperCase());
  store.reset();
  surenchereSocket.join(roomCode.value.trim().toUpperCase(), pseudo.value.trim());
}
</script>
