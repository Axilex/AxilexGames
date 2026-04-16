<template>
  <div class="flex flex-col gap-6">
    <!-- ── Podium : 2e gauche · 1er centre · 3e droite ── -->
    <div class="flex items-end justify-center gap-2 sm:gap-4">
      <!-- 2e -->
      <div v-if="entries[1]" class="flex flex-col items-center gap-1.5 order-1">
        <span class="text-xl sm:text-2xl leading-none">🥈</span>
        <div
          class="relative w-20 sm:w-24 rounded-t-xl bg-gradient-to-b from-stone-200 to-stone-300 flex flex-col items-center justify-end pb-3 px-1"
          style="height: 90px"
        >
          <p class="text-xs font-bold text-stone-700 truncate max-w-full text-center leading-tight">
            {{ entries[1].pseudo }}
          </p>
          <p class="text-[11px] font-semibold text-stone-500 mt-0.5">{{ entries[1].score }} pts</p>
          <span
            class="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-stone-500 bg-stone-100 rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
          >2</span>
        </div>
      </div>

      <!-- 1er -->
      <div v-if="entries[0]" class="flex flex-col items-center gap-1.5 order-2">
        <span class="text-2xl sm:text-3xl leading-none">🥇</span>
        <div
          class="relative w-24 sm:w-28 rounded-t-xl bg-gradient-to-b from-amber-300 to-amber-500 flex flex-col items-center justify-end pb-3 px-1 shadow-lg shadow-amber-200"
          style="height: 120px"
        >
          <p class="text-xs font-bold text-white truncate max-w-full text-center leading-tight">
            {{ entries[0].pseudo }}
          </p>
          <p class="text-[11px] font-semibold text-amber-100 mt-0.5">{{ entries[0].score }} pts</p>
          <span
            class="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-amber-700 bg-amber-100 rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
          >1</span>
        </div>
      </div>

      <!-- 3e -->
      <div v-if="entries[2]" class="flex flex-col items-center gap-1.5 order-3">
        <span class="text-xl sm:text-2xl leading-none">🥉</span>
        <div
          class="relative w-20 sm:w-24 rounded-t-xl bg-gradient-to-b from-orange-200 to-orange-400 flex flex-col items-center justify-end pb-3 px-1"
          style="height: 70px"
        >
          <p class="text-xs font-bold text-white truncate max-w-full text-center leading-tight">
            {{ entries[2].pseudo }}
          </p>
          <p class="text-[11px] font-semibold text-orange-100 mt-0.5">{{ entries[2].score }} pts</p>
          <span
            class="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-orange-700 bg-orange-100 rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
          >3</span>
        </div>
      </div>
    </div>

    <!-- ── Reste du classement (4e et au-delà) ── -->
    <div
      v-if="entries.length > 3"
      class="bg-white rounded-2xl border border-stone-200 overflow-hidden max-w-sm mx-auto w-full"
    >
      <ol>
        <li
          v-for="(entry, i) in entries.slice(3)"
          :key="entry.pseudo"
          :class="[
            'flex items-center justify-between px-4 py-2.5',
            i > 0 ? 'border-t border-stone-100' : '',
          ]"
        >
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-stone-400 w-5 tabular-nums">{{ i + 4 }}.</span>
            <span class="text-sm font-semibold text-stone-800">{{ entry.pseudo }}</span>
          </div>
          <span class="text-sm font-bold text-stone-600 tabular-nums">{{ entry.score }} pts</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface PodiumEntry {
  pseudo: string;
  score: number;
}

defineOptions({ name: 'GamePodium' });

defineProps<{
  /** Joueurs triés par score décroissant (index 0 = 1er). */
  entries: PodiumEntry[];
}>();
</script>
