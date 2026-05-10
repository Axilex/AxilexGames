<template>
  <nav class="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 group">
        <div
          class="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-amber-200 dark:shadow-none group-hover:shadow-amber-300 dark:group-hover:shadow-none transition-shadow"
        >
          <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span class="font-bold text-foreground text-base tracking-tight"
          >Axilex<span class="text-amber-500">Games</span></span
        >
      </router-link>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-full px-2.5 py-1 hidden sm:inline-flex items-center gap-1.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          En ligne
        </span>
        <button
          type="button"
          :aria-label="isDark ? 'Passer en mode clair' : 'Passer en mode sombre'"
          :title="isDark ? 'Mode clair' : 'Mode sombre'"
          class="inline-flex items-center justify-center w-9 h-9 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          @click="toggle"
        >
          <!-- Sun (shown in dark mode = "click to go light") -->
          <svg
            v-if="isDark"
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <!-- Moon (shown in light mode = "click to go dark") -->
          <svg
            v-else
            class="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useTheme } from '@/shared/composables/useTheme';

const { isDark, toggle } = useTheme();
</script>
