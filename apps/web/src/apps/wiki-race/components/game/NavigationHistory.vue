<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest">
        Mon chemin · {{ stepCount }} clic{{ stepCount > 1 ? 's' : '' }}
      </p>
      <button
        v-if="stepCount > 0"
        class="text-stone-400 hover:text-amber-600 transition-colors p-1 rounded hover:bg-amber-50"
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

    <div class="flex flex-col gap-1">
      <!-- Start page -->
      <span class="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 font-medium truncate">
        {{ decodeURIComponent(startSlug).replace(/_/g, ' ') }}
      </span>
      <!-- Steps -->
      <template v-for="(step, i) in history" :key="i">
        <div class="flex items-center gap-1 pl-2">
          <svg
            class="h-3 w-3 text-stone-300 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        <span
          :class="[
            'text-xs px-2 py-1 rounded-md font-medium truncate',
            i === history.length - 1
              ? 'bg-amber-100 text-amber-700'
              : 'bg-stone-100 text-stone-600',
          ]"
        >
          {{ decodeURIComponent(step.to).replace(/_/g, ' ') }}
        </span>
      </template>

      <span v-if="history.length === 0 && !startSlug" class="text-xs text-stone-400 italic">
        En attente...
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { NavigationStep } from '@wiki-race/shared';

const props = defineProps<{ history: NavigationStep[]; startSlug: string }>();

const copied = ref(false);
const stepCount = computed(() => props.history.length);

async function copyPath() {
  const pages = [props.startSlug, ...props.history.map((s) => s.to)];
  const text = pages.map((s) => decodeURIComponent(s).replace(/_/g, ' ')).join(' → ');
  await navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>
