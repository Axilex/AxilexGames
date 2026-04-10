<template>
  <component
    :is="to ? RouterLink : 'div'"
    v-bind="to ? { to } : {}"
    :class="[
      'group bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200',
      to
        ? 'border-stone-200 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/60 cursor-pointer'
        : 'border-dashed border-stone-200 opacity-60 cursor-default',
    ]"
  >
    <!-- Banner -->
    <div :class="['relative h-28 bg-gradient-to-br p-5 overflow-hidden flex items-end', gradient]">
      <div class="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
      <div class="absolute right-5 bottom-4 w-12 h-12 rounded-full bg-white/10" />

      <!-- Book icon -->
      <svg
        v-if="icon === 'book'"
        class="relative z-10 h-9 w-9 text-white drop-shadow"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>

      <!-- Soon icon -->
      <svg
        v-else-if="icon === 'soon'"
        class="relative z-10 h-9 w-9 text-white drop-shadow"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.75"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </div>

    <!-- Body -->
    <div class="p-5 flex flex-col gap-3 flex-1">
      <!-- Tags + players -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <span
          v-for="tag in tags"
          :key="tag"
          :class="[
            'text-xs font-semibold rounded-full px-2 py-0.5',
            tag === 'Bientôt'
              ? 'bg-stone-100 text-stone-400'
              : tag === 'Multijoueur'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-amber-50 text-amber-600',
          ]"
        >
          {{ tag }}
        </span>
        <span v-if="players" class="ml-auto text-xs text-stone-400 font-medium">
          {{ players }}
        </span>
      </div>

      <!-- Name + description -->
      <div class="flex flex-col gap-1.5">
        <h3 class="font-bold text-stone-900 text-base">
          {{ name }}
        </h3>
        <p class="text-sm text-stone-500 leading-relaxed">
          {{ description }}
        </p>
      </div>

      <!-- CTA -->
      <div class="mt-auto pt-2">
        <span
          v-if="live"
          class="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 group-hover:text-amber-700 transition-colors"
        >
          Jouer
          <svg
            class="h-4 w-4 translate-x-0 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
        <span v-else class="text-sm text-stone-300 font-medium"> Bientôt disponible </span>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{
  name: string;
  description: string;
  tags: string[];
  gradient: string;
  icon: string;
  to: string | null;
  live: boolean;
  players: string | null;
}>();
</script>
