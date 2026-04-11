<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <AppNav />

    <div class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md flex flex-col gap-5">
        <!-- Header -->
        <div class="text-center mb-2">
          <div
            class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl mb-4 shadow-md shadow-violet-200"
          >
            <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.75"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-stone-900 tracking-tight">Surenchère</h1>
          <p class="text-stone-500 mt-1 text-sm">Défiez-vous à coups d'enchères</p>
        </div>

        <ErrorToast :message="store.error" />

        <!-- Shared pseudo -->
        <BaseInput
          v-model="pseudo"
          label="Ton pseudo"
          placeholder="ex : Alice"
          :maxlength="16"
          :error="pseudoError"
          @enter="handleJoin"
        />

        <!-- Join room (first) -->
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-4">
          <h2 class="text-base font-semibold text-stone-800">Rejoindre une room</h2>
          <BaseInput
            v-model="joinCode"
            label="Code de la room"
            placeholder="ex : ABCDEF"
            :maxlength="6"
            :error="joinCodeError"
            class="font-mono uppercase"
            @enter="handleJoin"
          />
          <BaseButton variant="secondary" :loading="joining" class="w-full" @click="handleJoin">
            Rejoindre →
          </BaseButton>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px bg-stone-200" />
          <span class="text-xs text-stone-400 font-medium">ou</span>
          <div class="flex-1 h-px bg-stone-200" />
        </div>

        <!-- Create room (second) -->
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col gap-4">
          <h2 class="text-base font-semibold text-stone-800">Créer une room</h2>
          <BaseButton :loading="creating" class="w-full" @click="handleCreate">
            Créer une room →
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AppNav from '@/shared/components/ui/AppNav.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import ErrorToast from '@/shared/components/ui/ErrorToast.vue';
import { surenchereSocket } from '../services/surenchere.service';
import { useSurenchereSessionStore } from '@/shared/stores/useSurenchereSessionStore';
import { useSurenchereStore } from '../stores/useSurenchereStore';

const session = useSurenchereSessionStore();
const store = useSurenchereStore();

const pseudo = ref(session.pseudo);
const joinCode = ref('');
const pseudoError = ref('');
const joinCodeError = ref('');
const creating = ref(false);
const joining = ref(false);

const urlCode = new URLSearchParams(window.location.search).get('code');
if (urlCode) joinCode.value = urlCode.toUpperCase();

// Navigation handled by useSurenchereListeners — reset loading states here
watch(
  () => store.room,
  (room) => {
    if (room) {
      creating.value = false;
      joining.value = false;
    }
  },
);
watch(
  () => store.error,
  () => {
    creating.value = false;
    joining.value = false;
  },
);

function handleJoin(): void {
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
  store.clearError();
  joining.value = true;
  session.setSession(pseudo.value.trim(), joinCode.value.trim().toUpperCase());
  surenchereSocket.join(joinCode.value.trim().toUpperCase(), pseudo.value.trim());
}

function handleCreate(): void {
  pseudoError.value = '';
  if (!pseudo.value.trim()) {
    pseudoError.value = 'Entre un pseudo.';
    return;
  }
  store.clearError();
  creating.value = true;
  session.setSession(pseudo.value.trim(), '');
  surenchereSocket.create(pseudo.value.trim());
}
</script>
