<template>
  <div v-if="endsAt" class="flex flex-col gap-1">
    <div class="flex items-center justify-between text-xs text-stone-500">
      <span class="font-semibold uppercase tracking-widest">⏱ Temps enchères</span>
      <span :class="['font-bold tabular-nums', secondsLeft <= 5 ? 'text-red-600' : 'text-stone-700']">
        {{ secondsLeft }}s
      </span>
    </div>
    <div class="h-1.5 rounded-full bg-stone-100 overflow-hidden">
      <div
        class="h-full rounded-full transition-all"
        :class="secondsLeft <= 5 ? 'bg-red-500' : 'bg-amber-500'"
        :style="{ width: `${progressPct}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{ endsAt: number | null; totalMs?: number }>();
const total = computed(() => props.totalMs ?? 10_000);

const now = ref(Date.now());
let interval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now();
  }, 100);
});
onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const remaining = computed(() => {
  if (!props.endsAt) return 0;
  return Math.max(0, props.endsAt - now.value);
});

const secondsLeft = computed(() => Math.ceil(remaining.value / 1000));
const progressPct = computed(() => (remaining.value / total.value) * 100);
</script>
