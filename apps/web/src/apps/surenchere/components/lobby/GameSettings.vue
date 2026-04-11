<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4">
    <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">Paramètres</span>
    <div class="flex flex-col gap-2 text-sm text-stone-700">
      <div class="flex justify-between">
        <span>Nombre de manches</span>
        <span class="font-bold">{{ settings?.totalRounds ?? 5 }}</span>
      </div>
      <div class="flex justify-between">
        <span>Mise de départ</span>
        <span class="font-bold">{{ settings?.startBid ?? 5 }}</span>
      </div>
    </div>
    <BaseButton :disabled="disabled" @click="$emit('start')">Lancer la partie</BaseButton>
    <p v-if="disabled" class="text-xs text-stone-400 text-center">
      Il faut au moins 2 joueurs.
    </p>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import type { SurenchereRoomSettings } from '@wiki-race/shared';

defineProps<{ settings: SurenchereRoomSettings | undefined; disabled: boolean }>();
defineEmits<{ start: [] }>();
</script>
