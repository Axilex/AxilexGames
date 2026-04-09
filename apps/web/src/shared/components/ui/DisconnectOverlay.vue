<template>
  <Transition name="fade">
    <div
      v-if="hasConnectedOnce && (!isConnected || pendingRejoin)"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
    >
      <!-- Socket disconnected — waiting for auto-reconnect -->
      <div
        v-if="!isConnected"
        class="flex flex-col items-center gap-4 text-center"
      >
        <svg
          class="animate-spin h-10 w-10 text-amber-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p class="text-lg font-semibold text-stone-800">
          Connexion perdue…
        </p>
        <p class="text-sm text-stone-500">
          Vérifiez votre connexion réseau
        </p>
      </div>

      <!-- Socket reconnected — waiting for manual room rejoin -->
      <div
        v-else-if="pendingRejoin"
        class="flex flex-col items-center gap-5 text-center"
      >
        <div class="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
          <svg
            class="h-7 w-7 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-lg font-semibold text-stone-800">
            Connexion rétablie
          </p>
          <p class="text-sm text-stone-500">
            Cliquez pour rejoindre la partie
          </p>
        </div>
        <button
          class="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
          @click="onReconnect"
        >
          Reconnecter →
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSocketStore } from '../../stores/useSocketStore';

defineProps<{ onReconnect: () => void }>();

const socketStore = useSocketStore();
const { isConnected, hasConnectedOnce, pendingRejoin } = storeToRefs(socketStore);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
