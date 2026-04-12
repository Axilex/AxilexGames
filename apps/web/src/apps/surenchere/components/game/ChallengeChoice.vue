<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
        {{ isChooser ? 'À toi de choisir' : `${chooserName ?? 'Quelqu\'un'} choisit…` }}
      </span>
      <h2 class="text-xl font-bold text-stone-900">Choisis un défi</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button
        v-for="opt in options"
        :key="opt.id"
        :disabled="!isChooser || !!customPhrase.trim()"
        class="flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition"
        :class="
          isChooser && !customPhrase.trim()
            ? 'border-stone-200 bg-stone-50 hover:border-amber-500 hover:bg-amber-50 cursor-pointer'
            : 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
        "
        @click="pick(opt.id)"
      >
        <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
          {{ opt.category }}
        </span>
        <span class="text-sm text-stone-700 leading-snug">
          {{ opt.prompt }}
        </span>
        <span class="text-2xl font-extrabold text-stone-900">« {{ opt.letter }} »</span>
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
        <div class="flex gap-2">
          <input
            v-model="customPhrase"
            type="text"
            maxlength="200"
            placeholder="Ex: Citer des animaux qui commencent par..."
            class="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="button"
            :disabled="customPhrase.trim().length < 5"
            class="rounded-lg px-4 py-2 text-sm font-semibold transition"
            :class="
              customPhrase.trim().length >= 5
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            "
            @click="pickCustom"
          >
            Valider
          </button>
        </div>
        <p v-if="customPhrase.trim().length > 0 && customPhrase.trim().length < 5" class="text-xs text-red-500">
          Le défi doit faire au moins 5 caractères.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SurenchereChallenge } from '@wiki-race/shared';

const props = defineProps<{
  options: SurenchereChallenge[];
  isChooser: boolean;
  chooserName: string | null;
}>();

const emit = defineEmits<{
  choose: [options: { challengeId?: string; customPhrase?: string }];
}>();

const customPhrase = ref('');

function pick(id: string): void {
  if (props.isChooser && !customPhrase.value.trim()) emit('choose', { challengeId: id });
}

function pickCustom(): void {
  const phrase = customPhrase.value.trim();
  if (props.isChooser && phrase.length >= 5) emit('choose', { customPhrase: phrase });
}
</script>
