<template>
  <div class="bg-card rounded-2xl border border-border max-w-lg mx-auto w-full">
    <ol class="divide-y divide-border">
      <li
        v-for="(p, i) in ranked"
        :key="p.socketId"
        class="flex items-center justify-between px-5 py-3"
      >
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold text-foreground-subtle w-6">#{{ i + 1 }}</span>
          <span class="text-base font-semibold text-foreground">{{ p.pseudo }}</span>
        </div>
        <span class="text-base font-extrabold text-amber-600">{{ p.score }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import type { SurencherePlayer } from '@wiki-race/shared';

defineProps<{ ranked: SurencherePlayer[] }>();
</script>
