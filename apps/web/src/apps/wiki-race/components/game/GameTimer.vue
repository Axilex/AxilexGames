<template>
  <div
    :class="[
      'font-mono text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md',
      isCountdown && secondsLeft < 60
        ? 'text-red-600 bg-red-50 animate-pulse'
        : 'text-stone-500 bg-stone-100',
    ]"
    :title="isCountdown ? 'Temps restant' : 'Temps écoulé'"
  >
    {{ display }}
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{ startTime: number; timeLimitSeconds: number | null }>();

const elapsed = ref(0);
let interval: ReturnType<typeof setInterval>;

onMounted(() => {
  elapsed.value = Math.floor((Date.now() - props.startTime) / 1000);
  interval = setInterval(() => { elapsed.value = Math.floor((Date.now() - props.startTime) / 1000); }, 1000);
});
onUnmounted(() => clearInterval(interval));

const isCountdown = computed(() => props.timeLimitSeconds !== null);
const secondsLeft = computed(() =>
  props.timeLimitSeconds !== null ? Math.max(0, props.timeLimitSeconds - elapsed.value) : 0,
);
const displaySeconds = computed(() => (isCountdown.value ? secondsLeft.value : elapsed.value));
const display = computed(() => {
  const s = displaySeconds.value;
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
});
</script>
