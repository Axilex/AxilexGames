<template>
  <GamePodium :entries="rankings" />
</template>

<script setup lang="ts">
import GamePodium from '@/shared/components/ui/GamePodium.vue';
import type { TelepathieRankEntry } from '@wiki-race/shared';

defineOptions({ name: 'TelepathiePodium' });
defineProps<{ rankings: TelepathieRankEntry[] }>();
</script>
