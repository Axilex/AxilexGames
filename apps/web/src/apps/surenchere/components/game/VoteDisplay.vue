<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">
      Votes ({{ votedCount }}/{{ total }})
    </span>
    <ul class="flex flex-col gap-1">
      <li
        v-for="[pseudo, vote] in entries"
        :key="pseudo"
        class="flex items-center justify-between text-sm px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-100"
      >
        <span class="font-medium text-stone-800">{{ pseudo }}</span>
        <span v-if="vote === true" class="text-emerald-600 font-bold">✅</span>
        <span v-else-if="vote === false" class="text-red-600 font-bold">❌</span>
        <span v-else class="text-stone-300">⏳</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ votes: Record<string, boolean | null> }>();

const entries = computed(() => Object.entries(props.votes));
const total = computed(() => entries.value.length);
const votedCount = computed(() => entries.value.filter(([, v]) => v !== null).length);
</script>
