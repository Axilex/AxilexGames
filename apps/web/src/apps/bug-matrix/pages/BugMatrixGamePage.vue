<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-10 bg-card border-b border-border px-6 py-3">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <h1 class="text-base font-bold text-foreground">
          🧠 Bug dans la Matrix · manche {{ store.room?.round ?? 0 }}/{{
            store.room?.settings.roundCount ?? 0
          }}
        </h1>
        <div class="flex items-center gap-3">
          <span
            v-for="p in store.room?.players ?? []"
            :key="p.pseudo"
            class="text-xs text-foreground-muted"
          >
            {{ p.pseudo }} · <b class="text-foreground">{{ p.score }}</b>
          </span>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-5">
      <ThemeDisplay v-if="store.themeLabel" :theme-label="store.themeLabel" />

      <!-- BRIEF -->
      <template v-if="store.phase === 'BRIEF'">
        <SecretCard
          :role="store.myRole"
          :rule-label="store.myRuleLabel"
          :rule-category="store.myRuleCategory"
        />
        <PhaseTimer :ends-at="store.phaseTimerEndsAt" label="Mémorise ta carte…" />
      </template>

      <!-- DISCUSSION -->
      <template v-else-if="store.phase === 'DISCUSSION'">
        <QuestionPrompt :text="store.currentQuestion?.text ?? '…'" />
        <PhaseTimer :ends-at="store.phaseTimerEndsAt" label="Discussion (à l'oral)" />
        <details class="bg-card rounded-xl border border-border p-4 text-sm">
          <summary class="cursor-pointer font-semibold text-foreground-muted">
            Rappel de ta carte secrète
          </summary>
          <div class="mt-3">
            <SecretCard
              :role="store.myRole"
              :rule-label="store.myRuleLabel"
              :rule-category="store.myRuleCategory"
            />
          </div>
        </details>
      </template>

      <!-- VOTE -->
      <template v-else-if="store.phase === 'VOTE'">
        <PhaseTimer :ends-at="store.phaseTimerEndsAt" label="Vote" />
        <VotePanel
          :targets="store.voteTargets"
          :pending-votes="store.pendingVotes"
          :can-submit="store.canSubmitVote"
          :disabled="store.hasSubmittedVote"
          @select="onSelect"
          @submit="onSubmit"
        />
      </template>

      <!-- REVEAL -->
      <template v-else-if="store.phase === 'REVEAL' && store.lastResult">
        <RoundResultPanel :result="store.lastResult" />
        <p class="text-center text-sm text-foreground-muted">Prochaine manche dans quelques secondes…</p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { BugMatrixVoteLabel } from '@wiki-race/shared';
import { useBugMatrixStore } from '../stores/useBugMatrixStore';
import { bugMatrixSocket } from '../services/bug-matrix.service';
import ThemeDisplay from '../components/ThemeDisplay.vue';
import SecretCard from '../components/SecretCard.vue';
import QuestionPrompt from '../components/QuestionPrompt.vue';
import PhaseTimer from '../components/PhaseTimer.vue';
import VotePanel from '../components/VotePanel.vue';
import RoundResultPanel from '../components/RoundResultPanel.vue';

const store = useBugMatrixStore();

function onSelect(target: string, label: BugMatrixVoteLabel): void {
  store.setPendingVote(target, label);
}

function onSubmit(): void {
  bugMatrixSocket.submitVote({ ...store.pendingVotes });
  store.markVoteSubmitted();
}
</script>
