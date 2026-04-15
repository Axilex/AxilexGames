<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col gap-4">
    <span class="text-xs font-semibold uppercase tracking-widest text-stone-400">Paramètres</span>
    <div class="flex flex-col gap-3 text-sm text-stone-700">
      <div class="flex items-center justify-between gap-3">
        <span>Nombre de manches</span>
        <div class="flex items-center gap-1">
          <button
            class="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30"
            :disabled="localRounds <= 1"
            @click="changeRounds(-1)"
          >
            −
          </button>
          <span class="w-6 text-center font-bold">{{ localRounds }}</span>
          <button
            class="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30"
            :disabled="localRounds >= 20"
            @click="changeRounds(1)"
          >
            +
          </button>
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span>Mise de départ</span>
        <div class="flex items-center gap-1">
          <button
            class="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30"
            :disabled="localStartBid <= 1"
            @click="changeStartBid(-1)"
          >
            −
          </button>
          <span class="w-6 text-center font-bold">{{ localStartBid }}</span>
          <button
            class="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-30"
            :disabled="localStartBid >= 10"
            @click="changeStartBid(1)"
          >
            +
          </button>
        </div>
      </div>
    </div>
    <BaseButton :disabled="disabled" @click="$emit('start')">Lancer la partie</BaseButton>
    <p v-if="disabled" class="text-xs text-stone-400 text-center">Il faut au moins 2 joueurs.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import type { SurenchereRoomSettings } from '@wiki-race/shared';

const props = defineProps<{ settings: SurenchereRoomSettings | undefined; disabled: boolean }>();
const emit = defineEmits<{ start: []; 'update:settings': [{ totalRounds: number; startBid: number }] }>();

const localRounds = ref(props.settings?.totalRounds ?? 3);
const localStartBid = ref(props.settings?.startBid ?? 1);

watch(
  () => props.settings,
  (s) => {
    if (s) {
      localRounds.value = s.totalRounds;
      localStartBid.value = s.startBid;
    }
  },
);

function changeRounds(delta: number): void {
  localRounds.value = Math.min(20, Math.max(1, localRounds.value + delta));
  emit('update:settings', { totalRounds: localRounds.value, startBid: localStartBid.value });
}

function changeStartBid(delta: number): void {
  localStartBid.value = Math.min(10, Math.max(1, localStartBid.value + delta));
  emit('update:settings', { totalRounds: localRounds.value, startBid: localStartBid.value });
}
</script>
