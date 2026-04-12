<template>
  <div class="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-semibold uppercase tracking-widest text-amber-600">
          {{ bidderName ?? 'Joueur' }} propose
        </span>
        <h2 class="text-xl font-bold text-stone-900">Les mots</h2>
      </div>
      <!-- Voting progress chip (only in VOTING phase) -->
      <span
        v-if="showVoting"
        class="text-xs font-semibold bg-stone-100 text-stone-600 rounded-full px-3 py-1"
      >
        {{ votingProgress.voted }}/{{ votingProgress.total }} ont voté
      </span>
    </div>

    <!-- Word list -->
    <ul v-if="words && words.length" class="flex flex-col gap-3">
      <li
        v-for="(w, i) in words"
        :key="i"
        class="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
        :class="{
          'border-emerald-200 bg-emerald-50': showVoting && wordVerdict(i) === true,
          'border-red-200 bg-red-50': showVoting && wordVerdict(i) === false,
        }"
      >
        <!-- Word index + text -->
        <span class="text-xs font-bold text-stone-400 w-5 shrink-0">{{ i + 1 }}.</span>
        <span class="flex-1 text-sm font-semibold text-stone-900">{{ w }}</span>

        <!-- Vote counts (visible in VOTING for everyone) -->
        <div v-if="showVoting" class="flex items-center gap-2 text-xs font-semibold shrink-0">
          <span class="text-emerald-700"> ✅ {{ wordVotes?.[i]?.valid?.length ?? 0 }} </span>
          <span class="text-red-700"> ❌ {{ wordVotes?.[i]?.invalid?.length ?? 0 }} </span>
        </div>

        <!-- Vote buttons (only for eligible voters who haven't voted on this word) -->
        <div v-if="canVote && !hasVotedOnWord(i)" class="flex gap-1 shrink-0">
          <button
            class="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
            @click="$emit('vote', { wordIndex: i, valid: true })"
          >
            ✅ Valide
          </button>
          <button
            class="px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold border border-red-200 transition-colors"
            @click="$emit('vote', { wordIndex: i, valid: false })"
          >
            ❌ Invalide
          </button>
        </div>

        <!-- Already voted indicator -->
        <span
          v-else-if="canVote && hasVotedOnWord(i)"
          class="text-xs font-semibold shrink-0 px-2.5 py-1.5 rounded-lg"
          :class="
            myVoteOnWord(i) === true
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-red-100 text-red-700 border border-red-200'
          "
        >
          {{ myVoteOnWord(i) === true ? '✅ Votre vote' : '❌ Votre vote' }}
        </span>
      </li>
    </ul>
    <p v-else class="text-sm text-stone-400">Aucun mot soumis.</p>

    <!-- Waiting message for bidder during voting -->
    <p v-if="showVoting && !canVote" class="text-sm text-stone-500 text-center">
      En attente des votes des autres joueurs…
    </p>
  </div>
</template>

<script setup lang="ts">
import type { WordVotes } from '@wiki-race/shared';

const props = defineProps<{
  words: string[] | null;
  bidderName: string | null;
  // Optional voting props (present only in VOTING phase)
  showVoting?: boolean;
  canVote?: boolean;
  wordVotes?: Record<number, WordVotes>;
  votingProgress?: { voted: number; total: number };
  hasVotedOnWord: (i: number) => boolean;
  myVoteOnWord: (i: number) => boolean | null;
}>();

defineEmits<{
  vote: [{ wordIndex: number; valid: boolean }];
}>();

function wordVerdict(i: number): boolean | null {
  const slot = props.wordVotes?.[i];
  if (!slot) return null;
  if (slot.valid.length === 0 && slot.invalid.length === 0) return null;
  return slot.valid.length > slot.invalid.length;
}
</script>
