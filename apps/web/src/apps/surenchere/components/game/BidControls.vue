<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
    <template v-if="canBid">
      <div class="flex items-center gap-3">
        <button
          class="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg"
          @click="dec"
        >
          −
        </button>
        <input
          v-model.number="amount"
          type="number"
          :min="minAmount"
          class="flex-1 text-center text-2xl font-bold bg-stone-50 border border-stone-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          class="w-10 h-10 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-lg"
          @click="inc"
        >
          +
        </button>
      </div>
      <div class="flex gap-2">
        <BaseButton variant="secondary" class="flex-1" @click="$emit('pass')">Passer</BaseButton>
        <BaseButton class="flex-1" :disabled="amount < minAmount" @click="$emit('bid', amount)">
          Surenchérir ({{ amount }})
        </BaseButton>
      </div>
    </template>

    <template v-else-if="hasPassed">
      <p class="text-center text-sm text-stone-500 py-4">Vous avez passé pour cette manche.</p>
    </template>

    <template v-else-if="canChallenge">
      <BaseButton @click="$emit('challenge')">Lancer le défi !</BaseButton>
    </template>

    <template v-else>
      <p class="text-center text-sm text-stone-500 py-4">En attente des autres joueurs…</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
const props = defineProps<{
  canBid: boolean;
  canChallenge: boolean;
  hasPassed: boolean;
  currentBid: number;
  startBid: number;
}>();

defineEmits<{
  bid: [amount: number];
  pass: [];
  challenge: [];
}>();

const minAmount = computed(() =>
  props.currentBid > 0 ? props.currentBid + 1 : props.startBid,
);
const amount = ref(minAmount.value);

watch(minAmount, (v) => {
  if (amount.value < v) amount.value = v;
});

function inc(): void {
  amount.value += 1;
}
function dec(): void {
  if (amount.value > minAmount.value) amount.value -= 1;
}
</script>
