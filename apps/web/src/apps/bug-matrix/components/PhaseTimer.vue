<template>
  <div class="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
    <span class="text-xs font-semibold uppercase tracking-wider text-stone-500">{{ label }}</span>
    <span class="text-2xl font-bold text-emerald-600 tabular-nums">{{ display }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const props = defineProps<{ endsAt: number | null; label: string }>();

const now = ref<number>(Date.now());
let handle: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  handle = setInterval(() => {
    now.value = Date.now();
  }, 250);
});
onBeforeUnmount(() => {
  if (handle !== null) clearInterval(handle);
});

const display = computed(() => {
  if (!props.endsAt) return '—';
  const ms = Math.max(0, props.endsAt - now.value);
  const sec = Math.ceil(ms / 1000);
  return `${sec}s`;
});
</script>
