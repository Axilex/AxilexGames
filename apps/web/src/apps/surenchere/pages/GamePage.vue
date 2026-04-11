<template>
  <div class="min-h-screen bg-stone-50 flex flex-col">
    <header class="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-3">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <h1 class="text-base font-bold text-stone-900">
          🏆 Surenchère
          <span class="text-stone-400 font-normal ml-2">
            Manche {{ store.room?.currentRound ?? 0 }} / {{ store.room?.settings.totalRounds ?? 0 }}
          </span>
        </h1>
        <ScoresBand :players="store.room?.players ?? []" :my-socket-id="store.mySocketId" />
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 flex flex-col gap-6">
        <!-- CHOOSING_CHALLENGE -->
        <ChallengeChoice
          v-if="store.phase === 'CHOOSING_CHALLENGE'"
          :options="store.challengeOptions"
          :is-chooser="store.isChallengeChooser"
          :chooser-name="store.challengeChooser?.pseudo ?? null"
          @choose="onChooseChallenge"
        />

        <!-- BIDDING / WORDS / VERDICT / ROUND_END all show the challenge card -->
        <template v-else>
          <ChallengeCard
            :challenge="store.currentChallenge"
            :current-bid="store.currentBid"
            :current-bidder="store.currentBidder?.pseudo ?? null"
            :phase="store.phase"
            :was-forced="store.wasForced"
            :forced-bonus="store.passedSocketIds.length"
          />

          <!-- BIDDING -->
          <BidControls
            v-if="store.phase === 'BIDDING'"
            :can-bid="store.canBid"
            :can-challenge="store.canChallenge"
            :has-passed="store.hasPassed"
            :current-bid="store.currentBid"
            :start-bid="store.room?.settings.startBid ?? 5"
            @bid="onBid"
            @pass="onPass"
            @challenge="onChallenge"
          />

          <!-- WORDS -->
          <WordsInput
            v-else-if="store.phase === 'WORDS'"
            :count="store.currentBid"
            :can-submit="store.canSubmitWords"
            :bidder-name="store.currentBidder?.pseudo ?? null"
            @submit="onSubmitWords"
          />

          <!-- VERDICT -->
          <template v-else-if="store.phase === 'VERDICT'">
            <WordsDisplay
              :words="store.currentWords"
              :bidder-name="store.currentBidder?.pseudo ?? null"
            />
            <div
              v-if="store.isHost"
              class="bg-white rounded-2xl border border-stone-200 p-6 flex gap-2"
            >
              <BaseButton variant="secondary" class="flex-1" @click="onVerdict(true)">
                ✅ Réussi
              </BaseButton>
              <BaseButton variant="danger" class="flex-1" @click="onVerdict(false)">
                ❌ Raté
              </BaseButton>
            </div>
            <div
              v-else
              class="bg-white rounded-2xl border border-stone-200 p-6 text-sm text-stone-500 text-center"
            >
              En attente du verdict…
            </div>
          </template>

          <!-- ROUND_END -->
          <div
            v-else-if="store.phase === 'ROUND_END'"
            class="bg-white rounded-2xl border border-stone-200 p-6 text-sm text-stone-500 text-center"
          >
            Prochaine manche dans quelques secondes…
          </div>
        </template>
      </div>

      <div class="md:col-span-1">
        <RoundHistory :history="store.roundHistory" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import ChallengeCard from '../components/game/ChallengeCard.vue';
import ChallengeChoice from '../components/game/ChallengeChoice.vue';
import BidControls from '../components/game/BidControls.vue';
import WordsInput from '../components/game/WordsInput.vue';
import WordsDisplay from '../components/game/WordsDisplay.vue';
import ScoresBand from '../components/game/ScoresBand.vue';
import RoundHistory from '../components/game/RoundHistory.vue';
import BaseButton from '@/shared/components/ui/BaseButton.vue';
import { useSurenchereStore } from '../stores/useSurenchereStore';
import { surenchereSocket } from '../services/surenchere.service';

const store = useSurenchereStore();

function onChooseChallenge(challengeId: string): void {
  surenchereSocket.chooseChallenge(challengeId);
}
function onBid(amount: number): void {
  surenchereSocket.bid(amount);
}
function onPass(): void {
  surenchereSocket.pass();
}
function onChallenge(): void {
  surenchereSocket.challenge();
}
function onSubmitWords(words: string[]): void {
  surenchereSocket.submitWords(words);
}
function onVerdict(success: boolean): void {
  surenchereSocket.verdict(success);
}
</script>
