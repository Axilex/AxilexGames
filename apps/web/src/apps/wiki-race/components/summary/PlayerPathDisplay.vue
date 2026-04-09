<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span
        v-if="isWinner"
        class="text-amber-500 text-lg"
      >🏆</span>
      <span
        v-else-if="surrendered"
        class="text-red-400 text-lg"
      >✕</span>
      <span
        v-else
        class="text-stone-300 text-lg"
      >—</span>
      <span class="font-semibold text-stone-800">{{ pseudo }}</span>
      <span class="text-stone-400 text-sm">{{ hopCount }} clic{{ hopCount !== 1 ? 's' : '' }}</span>
      <button
        v-if="path.length > 0"
        class="ml-auto text-stone-300 hover:text-amber-500 transition-colors p-1 rounded hover:bg-amber-50"
        :title="copied ? 'Copié !' : 'Copier le chemin'"
        @click="copyPath"
      >
        <svg
          v-if="!copied"
          class="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <svg
          v-else
          class="h-3.5 w-3.5 text-emerald-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-1 pl-6">
      <span class="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
        {{ decodeURIComponent(startSlug).replace(/_/g, ' ') }}
      </span>
      <template
        v-for="(step, i) in path"
        :key="i"
      >
        <svg
          class="h-3 w-3 text-stone-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span
          :class="[
            'px-2 py-0.5 rounded-md text-xs font-medium',
            step.to === targetSlug
              ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
              : 'bg-stone-100 text-stone-700',
          ]"
        >
          {{ decodeURIComponent(step.to).replace(/_/g, ' ') }}
        </span>
      </template>
      <span
        v-if="path.length === 0"
        class="text-stone-400 text-xs italic"
      >N'a pas bougé</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { NavigationStep } from '@wiki-race/shared';

const props = defineProps<{
  pseudo: string;
  isWinner: boolean;
  surrendered: boolean;
  hopCount: number;
  path: NavigationStep[];
  startSlug: string;
  targetSlug: string;
}>();

const copied = ref(false);

async function copyPath() {
  const pages = [props.startSlug, ...props.path.map((s) => s.to)];
  const text = pages.map((s) => decodeURIComponent(s).replace(/_/g, ' ')).join(' → ');
  await navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}
</script>
