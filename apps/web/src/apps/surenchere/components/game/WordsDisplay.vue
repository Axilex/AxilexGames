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
    </div>

    <!-- Word list -->
    <ul v-if="words && words.length" class="flex flex-col gap-2">
      <li
        v-for="(w, i) in words"
        :key="i"
        class="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5"
        :class="{
          'border-emerald-200 bg-emerald-50':
            showVoting && finalVerdicts && finalVerdicts[i] === true,
          'border-red-200 bg-red-50': showVoting && finalVerdicts && finalVerdicts[i] === false,
        }"
      >
        <span class="text-xs font-bold text-stone-400 w-5 shrink-0">{{ i + 1 }}.</span>
        <span class="flex-1 text-sm font-semibold text-stone-900">{{ w }}</span>
      </li>
    </ul>
    <p v-else class="text-sm text-stone-400">Aucun mot soumis.</p>

    <!-- Live typing display (non-bidder during WORDS phase) -->
    <LiveTypingDisplay v-if="typingText" :pseudo="typingPseudo ?? ''" :text="typingText" />

    <!-- Block vote section (VOTING phase) -->
    <template v-if="showVoting">
      <!-- Vote buttons for eligible voters who haven't voted yet -->
      <div v-if="canVote && myVote === null" class="flex gap-3">
        <button
          class="flex-1 py-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-bold border border-emerald-200 transition-colors"
          @click="$emit('vote', true)"
        >
          ✅ Accepter
        </button>
        <button
          class="flex-1 py-3 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-sm font-bold border border-red-200 transition-colors"
          @click="$emit('vote', false)"
        >
          ❌ Refuser
        </button>
      </div>

      <!-- Already voted indicator -->
      <div
        v-else-if="canVote && myVote !== null"
        class="px-4 py-2.5 rounded-xl text-sm font-semibold text-center"
        :class="
          myVote === true
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        "
      >
        {{ myVote === true ? '✅ Vous avez accepté' : '❌ Vous avez refusé' }}
      </div>

      <!-- Bidder waiting message -->
      <p v-else-if="!canVote" class="text-sm text-stone-500 text-center">
        En attente du vote des autres joueurs…
      </p>

      <!-- Vote progress display -->
      <VoteDisplay v-if="voteMap && Object.keys(voteMap).length" :votes="voteMap" />
    </template>
  </div>
</template>

<script setup lang="ts">
import LiveTypingDisplay from './LiveTypingDisplay.vue';
import VoteDisplay from './VoteDisplay.vue';

defineProps<{
  words: string[] | null;
  bidderName: string | null;
  showVoting?: boolean;
  canVote?: boolean;
  myVote?: boolean | null;
  voteMap?: Record<string, boolean | null>;
  /** Final verdicts per word (shown after round end) */
  finalVerdicts?: boolean[] | null;
  typingText?: string;
  typingPseudo?: string;
}>();

defineEmits<{
  vote: [accept: boolean];
}>();
</script>
