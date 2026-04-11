<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
        {{ canSubmit ? 'À toi de jouer' : `${bidderName ?? 'Le joueur'} écrit ses mots…` }}
      </span>
      <h2 class="text-xl font-bold text-stone-900">
        {{ canSubmit ? `Écris tes ${count} mots` : `${count} mots à trouver` }}
      </h2>
    </div>

    <template v-if="canSubmit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          v-for="(_, i) in words"
          :key="i"
          v-model="words[i]"
          type="text"
          :placeholder="`Mot ${i + 1}`"
          class="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
      <BaseButton :disabled="!isValid" @click="submit">Valider mes mots</BaseButton>
    </template>
    <p v-else class="text-sm text-stone-500 text-center py-4">
      En attente de la saisie…
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';

const props = defineProps<{
  count: number;
  canSubmit: boolean;
  bidderName: string | null;
}>();

const emit = defineEmits<{ submit: [words: string[]] }>();

const words = ref<string[]>(Array.from({ length: props.count }, () => ''));

watch(
  () => props.count,
  (n) => {
    words.value = Array.from({ length: n }, (_, i) => words.value[i] ?? '');
  },
);

const isValid = computed(() => words.value.every((w) => w.trim().length > 0));

function submit(): void {
  if (!isValid.value) return;
  emit(
    'submit',
    words.value.map((w) => w.trim()),
  );
}
</script>
