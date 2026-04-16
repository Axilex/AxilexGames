<template>
  <div class="w-full flex flex-col gap-1.5">
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium text-stone-500">Temps restant</span>
      <span
        :class="[
          'text-sm font-bold tabular-nums',
          secondsLeft <= 3 ? 'text-red-500' : 'text-stone-700',
        ]"
      >
        {{ secondsLeft }}s
      </span>
    </div>
    <div class="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
      <div
        :class="[
          'h-full rounded-full transition-none',
          secondsLeft <= 3 ? 'bg-red-400' : 'bg-violet-500',
        ]"
        :style="{ width: `${pct}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';

const props = defineProps<{
  endsAt: number;
  totalMs: number;
}>();

const now = ref(Date.now());

let raf: number;

function tick(): void {
  now.value = Date.now();
  raf = requestAnimationFrame(tick);
}

raf = requestAnimationFrame(tick);

onUnmounted(() => cancelAnimationFrame(raf));

const secondsLeft = computed(() => Math.max(0, Math.ceil((props.endsAt - now.value) / 1000)));

const pct = computed(() => {
  const remaining = props.endsAt - now.value;
  return Math.max(0, Math.min(100, (remaining / props.totalMs) * 100));
});

watch(secondsLeft, (v) => {
  if (v === 0) cancelAnimationFrame(raf);
});
</script>
