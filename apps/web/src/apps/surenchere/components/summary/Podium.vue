<template>
  <GamePodium :entries="ranked" />
</template>

<script setup lang="ts">
import GamePodium from '@/shared/components/ui/GamePodium.vue';
import type { SurencherePlayer } from '@wiki-race/shared';

defineOptions({ name: 'SurencherePodium' });
defineProps<{ ranked: SurencherePlayer[] }>();
</script>
