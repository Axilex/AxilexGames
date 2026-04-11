<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <AppNav />

    <div class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md flex flex-col gap-5">
        <!-- Header -->
        <div class="text-center mb-2">
          <div
            class="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-4 shadow-md shadow-amber-200"
          >
            <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.75"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-stone-900 tracking-tight">WikiRace</h1>
          <p class="text-stone-500 mt-1 text-sm">Course de page en page sur Wikipédia</p>
        </div>

        <ErrorToast :message="lobbyStore.error" />

        <!-- Shared pseudo -->
        <BaseInput
          v-model="pseudo"
          label="Ton pseudo"
          placeholder="ex : Alice"
          :maxlength="20"
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
import { useRouter } from 'vue-router';
import { useLobby } from '../composables/useLobby';
import { useSessionStore } from '@/shared/stores/useSessionStore';
import AppNav from '@/shared/components/ui/AppNav.vue';
import BaseInput from '@/shared/components/ui/BaseInput.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import ErrorToast from '@/shared/components/ui/ErrorToast.vue';

const router = useRouter();
const { createRoom, joinRoom, lobbyStore } = useLobby();
const sessionStore = useSessionStore();

const pseudo = ref(sessionStore.pseudo);
const joinCode = ref('');
const pseudoError = ref('');
const joinCodeError = ref('');
const creating = ref(false);
const joining = ref(false);

const urlCode = new URLSearchParams(window.location.search).get('code');
if (urlCode) joinCode.value = urlCode.toUpperCase();

watch(
  () => lobbyStore.room,
  (room) => {
    if (room) {
      creating.value = false;
      joining.value = false;
      router.push({ name: 'lobby' });
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

function handleJoin() {
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
  joining.value = true;
  joinRoom(joinCode.value.trim().toUpperCase(), pseudo.value.trim());
}

function handleCreate() {
  pseudoError.value = '';
  if (!pseudo.value.trim()) {
    pseudoError.value = 'Entre un pseudo.';
    return;
  }
  creating.value = true;
  createRoom(pseudo.value.trim());
}
</script>
