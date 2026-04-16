<template>
  <GamePodium :entries="rankings" />
</template>

<script setup lang="ts">
import GamePodium from '@/shared/components/ui/GamePodium.vue';
import type { SnapAvisRankEntry } from '@wiki-race/shared';

defineOptions({ name: 'RankPodium' });
defineProps<{ rankings: SnapAvisRankEntry[] }>();
</script>
