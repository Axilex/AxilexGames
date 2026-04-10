<template>
  <nav class="bg-white border-b border-stone-200 sticky top-0 z-40">
    <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2.5 group">
        <div
          class="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-amber-200 group-hover:shadow-amber-300 transition-shadow"
        >
          <svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span class="font-bold text-stone-900 text-base tracking-tight"
          >Axilex<span class="text-amber-500">Games</span></span
        >
      </router-link>

      <!-- Right side -->
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 hidden sm:inline-flex items-center gap-1.5"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          En ligne
        </span>
      </div>
    </div>
  </nav>
</template>
