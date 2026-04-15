<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-5">
    <!-- Header -->
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
        {{ isChooser ? 'À toi de choisir' : `${chooserName ?? "Quelqu'un"} choisit…` }}
      </span>
      <h2 class="text-xl font-bold text-stone-900">Choisis un défi</h2>
    </div>

    <!-- Challenge cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button
        v-for="opt in options"
        :key="opt.id"
        :disabled="!isChooser || hasCustomPhrase"
        class="flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition"
        :class="
          !isChooser || hasCustomPhrase
            ? 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
            : selectedId === opt.id
              ? 'border-amber-500 bg-amber-50 cursor-pointer'
              : 'border-stone-200 bg-stone-50 hover:border-amber-400 hover:bg-amber-50 cursor-pointer'
        "
        @click="selectChallenge(opt.id)"
      >
        <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
          {{ opt.category }}
        </span>
        <span class="text-sm text-stone-700 leading-snug">{{ opt.prompt }}</span>
      </button>
    </div>

    <!-- Custom phrase input (chooser only) -->
    <template v-if="isChooser">
      <div class="flex items-center gap-2 text-xs text-stone-400">
        <div class="flex-1 h-px bg-stone-200" />
        <span>ou</span>
        <div class="flex-1 h-px bg-stone-200" />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-stone-500">Écris ton propre défi…</label>
        <input
          v-model="customPhrase"
          type="text"
          maxlength="200"
          placeholder="Ex: Citer des animaux qui commencent par..."
          class="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          @input="onCustomPhraseInput"
        />
        <p
          v-if="customPhrase.trim().length > 0 && customPhrase.trim().length < 5"
          class="text-xs text-red-500"
        >
          Le défi doit faire au moins 5 caractères.
        </p>
      </div>
    </template>

    <!-- Confirm button — shown once a challenge or phrase is selected (chooser only) -->
    <template v-if="isChooser && hasSelection">
      <button
        class="self-end rounded-xl px-6 py-2.5 text-sm font-semibold transition bg-amber-600 text-white hover:bg-amber-700"
        @click="confirm"
      >
        Confirmer →
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { SurenchereChallenge } from '@wiki-race/shared';

const props = defineProps<{
  options: SurenchereChallenge[];
  isChooser: boolean;
  chooserName: string | null;
}>();

const emit = defineEmits<{
  choose: [options: { challengeId?: string; customPhrase?: string }];
}>();

const selectedId = ref<string | null>(null);
const customPhrase = ref('');

const hasCustomPhrase = computed(() => customPhrase.value.trim().length >= 5);
const hasSelection = computed(() => !!selectedId.value || hasCustomPhrase.value);

function selectChallenge(id: string): void {
  if (!props.isChooser || hasCustomPhrase.value) return;
  selectedId.value = id;
}

function onCustomPhraseInput(): void {
  if (hasCustomPhrase.value) {
    selectedId.value = null;
  }
}

function confirm(): void {
  if (!hasSelection.value) return;
  if (hasCustomPhrase.value) {
    emit('choose', { customPhrase: customPhrase.value.trim() });
  } else if (selectedId.value) {
    emit('choose', { challengeId: selectedId.value });
  }
}
</script>
