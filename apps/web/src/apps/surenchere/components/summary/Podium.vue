<template>
  <div class="flex items-end justify-center gap-4">
    <div
      v-for="(p, i) in top3"
      :key="p.socketId"
      :class="['flex flex-col items-center gap-2', order(i)]"
    >
      <div class="text-2xl">{{ medal(i) }}</div>
      <div
        :class="[
          'rounded-t-xl bg-gradient-to-b from-amber-400 to-amber-500 flex items-end justify-center text-white font-extrabold pb-3 px-6',
          height(i),
        ]"
      >
        {{ p.pseudo }}
      </div>
      <div class="text-lg font-extrabold text-stone-900">{{ p.score }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SurencherePodium' });
import { computed } from 'vue';
import type { SurencherePlayer } from '@wiki-race/shared';

const props = defineProps<{ ranked: SurencherePlayer[] }>();

// Display order for visual podium: 2nd on left, 1st center, 3rd right.
const top3 = computed(() => {
  const arr = props.ranked.slice(0, 3);
  // Reorder visually: index 1 (2nd), 0 (1st), 2 (3rd)
  const visual: SurencherePlayer[] = [];
  if (arr[1]) visual.push(arr[1]);
  if (arr[0]) visual.push(arr[0]);
  if (arr[2]) visual.push(arr[2]);
  return visual;
});

function height(visualIdx: number): string {
  // 0 = 2nd, 1 = 1st, 2 = 3rd
  return ['h-24', 'h-32', 'h-20'][visualIdx] ?? 'h-20';
}

function medal(visualIdx: number): string {
  return ['🥈', '🥇', '🥉'][visualIdx] ?? '';
}

function order(visualIdx: number): string {
  return ['order-1', 'order-2', 'order-3'][visualIdx] ?? '';
}
</script>
