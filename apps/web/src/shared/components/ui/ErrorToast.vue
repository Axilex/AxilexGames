<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-1 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="message"
      class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
      role="alert"
    >
      <svg
        class="h-4 w-4 shrink-0 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
      <span>{{ friendlyMessage }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ message: string | null }>();

const ERROR_LABELS: Record<string, string> = {
  ROOM_NOT_FOUND: 'Room introuvable. Vérifie le code.',
  PSEUDO_TAKEN: 'Ce pseudo est déjà pris dans cette room.',
  ROOM_FULL: 'Cette room est complète (8 joueurs max).',
  GAME_IN_PROGRESS: 'La partie a déjà commencé.',
  NOT_HOST: 'Seul le host peut faire ça.',
  INVALID_NAVIGATION: "Ce lien n'est pas accessible depuis ta page actuelle.",
  RATE_LIMITED: 'Trop vite ! Attends un instant.',
};

const friendlyMessage = computed(() =>
  props.message ? (ERROR_LABELS[props.message] ?? props.message) : '',
);
</script>
