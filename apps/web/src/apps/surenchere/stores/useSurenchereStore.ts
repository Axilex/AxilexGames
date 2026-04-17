import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  PlayerStatus,
  type SurenchereRoomDTO,
  type SurenchereGamePhase,
  type SurenchereRoundResult,
  type SurencherePlayer,
} from '@wiki-race/shared';

export const useSurenchereStore = defineStore('surenchere', () => {
  // ── Source of truth ──────────────────────────────────────────────────────────
  const room = ref<SurenchereRoomDTO | null>(null);
  const mySocketId = ref<string>('');

  // ── Side-channel state (not carried in room DTO) ─────────────────────────────
  /** Block-vote display: pseudo → true/false/null (null = not yet voted) */
  const voteMap = ref<Record<string, boolean | null>>({});
  const roundHistory = ref<SurenchereRoundResult[]>([]);
  const finalRanking = ref<SurencherePlayer[]>([]);
  const error = ref<string>('');
  /** Live typing (WORDS phase, bidder → observers) */
  const typingText = ref<string>('');
  const typingPseudo = ref<string>('');

  // ── Computed from room ───────────────────────────────────────────────────────
  const phase = computed<SurenchereGamePhase>(() => room.value?.phase ?? 'WAITING');
  const currentChallenge = computed(() => room.value?.currentChallenge ?? null);
  const challengeOptions = computed(() => room.value?.challengeOptions ?? []);
  const challengeChooserSocketId = computed(() => room.value?.challengeChooserSocketId ?? null);
  const currentBid = computed(() => room.value?.currentBid ?? 0);
  const currentBidderSocketId = computed(() => room.value?.currentBidderSocketId ?? null);
  const passedSocketIds = computed(() => room.value?.passedSocketIds ?? []);
  const currentWords = computed(() => room.value?.currentWords ?? null);
  const wasForced = computed(() => room.value?.wasForced ?? false);
  const chooseTimerEndsAt = computed(() => room.value?.chooseTimerEndsAt ?? null);
  const bidTimerEndsAt = computed(() => room.value?.bidTimerEndsAt ?? null);
  const wordsTimerEndsAt = computed(() => room.value?.wordsTimerEndsAt ?? null);
  const scores = computed<Record<string, number>>(() => {
    if (!room.value) return {};
    return Object.fromEntries(room.value.players.map((p) => [p.pseudo, p.score]));
  });

  const isHost = computed(() => {
    if (!room.value) return false;
    return room.value.players.find((p) => p.socketId === mySocketId.value)?.isHost ?? false;
  });

  const myPlayer = computed(
    () => room.value?.players.find((p) => p.socketId === mySocketId.value) ?? null,
  );

  const myPseudo = computed(() => myPlayer.value?.pseudo ?? '');

  const currentBidder = computed(
    () => room.value?.players.find((p) => p.socketId === currentBidderSocketId.value) ?? null,
  );

  const challengeChooser = computed(
    () => room.value?.players.find((p) => p.socketId === challengeChooserSocketId.value) ?? null,
  );

  const activeOthers = computed(() => {
    if (!room.value) return [] as SurencherePlayer[];
    return room.value.players.filter(
      (p) => p.status === PlayerStatus.CONNECTED && p.socketId !== currentBidderSocketId.value,
    );
  });

  const allPassed = computed(() => {
    const others = activeOthers.value;
    return (
      currentBidderSocketId.value !== null &&
      others.length > 0 &&
      others.every((p) => passedSocketIds.value.includes(p.socketId))
    );
  });

  const hasPassed = computed(() => passedSocketIds.value.includes(mySocketId.value));

  const canBid = computed(
    () =>
      phase.value === 'BIDDING' &&
      mySocketId.value !== currentBidderSocketId.value &&
      !hasPassed.value,
  );

  const canChallenge = computed(
    () =>
      phase.value === 'BIDDING' &&
      mySocketId.value === currentBidderSocketId.value &&
      allPassed.value,
  );

  const isChallengeChooser = computed(
    () =>
      phase.value === 'CHOOSING_CHALLENGE' &&
      mySocketId.value === challengeChooserSocketId.value,
  );

  const canSubmitWords = computed(
    () => phase.value === 'WORDS' && mySocketId.value === currentBidderSocketId.value,
  );

  const canVote = computed(
    () => phase.value === 'VOTING' && mySocketId.value !== currentBidderSocketId.value,
  );

  const myVote = computed(() => voteMap.value[myPseudo.value] ?? null);

  const votingProgress = computed(() => {
    if (!room.value) return { voted: 0, total: 0 };
    const voters = room.value.players.filter(
      (p) => p.status === PlayerStatus.CONNECTED && p.socketId !== currentBidderSocketId.value,
    );
    const voted = voters.filter((p) => {
      const v = voteMap.value[p.pseudo];
      return v !== null && v !== undefined;
    }).length;
    return { voted, total: voters.length };
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  function setRoom(newRoom: SurenchereRoomDTO): void {
    room.value = newRoom;
    if (newRoom.phase !== 'WORDS') {
      typingText.value = '';
      typingPseudo.value = '';
    }
  }

  /** Optimistic update for `round:start` (resets vote/typing before room:update arrives). */
  function startRound(_payload: { round: number; firstBidderSocketId: string }): void {
    voteMap.value = {};
    typingText.value = '';
    typingPseudo.value = '';
  }

  /** Optimistic update for `bid:update` (reflects new bid before room:update arrives). */
  function updateBid(payload: { bidderSocketId: string; amount: number }): void {
    if (!room.value) return;
    room.value.currentBidderSocketId = payload.bidderSocketId;
    room.value.currentBid = payload.amount;
  }

  /** Optimistic update for `pass:update` (reflects new pass before room:update arrives). */
  function addPass(socketId: string): void {
    if (!room.value) return;
    if (!room.value.passedSocketIds.includes(socketId)) {
      room.value.passedSocketIds.push(socketId);
    }
  }

  function setVoteUpdate(votes: Record<string, boolean | null>): void {
    voteMap.value = { ...votes };
  }

  /** Optimistic update for `timer-update` (before next room:update arrives). */
  function setTimerUpdate(timerPhase: 'CHOOSING' | 'BIDDING' | 'WORDS', endsAt: number): void {
    if (!room.value) return;
    if (timerPhase === 'CHOOSING') room.value.chooseTimerEndsAt = endsAt;
    else if (timerPhase === 'BIDDING') room.value.bidTimerEndsAt = endsAt;
    else room.value.wordsTimerEndsAt = endsAt;
  }

  function setTyping(payload: { pseudo: string; text: string }): void {
    typingText.value = payload.text;
    typingPseudo.value = payload.pseudo;
  }

  function addRoundResult(result: SurenchereRoundResult): void {
    roundHistory.value.unshift(result);
  }

  function setFinished(payload: {
    scores: Record<string, number>;
    ranked: SurencherePlayer[];
  }): void {
    finalRanking.value = [...payload.ranked];
  }

  function setError(msg: string): void {
    error.value = msg;
  }

  function clearError(): void {
    error.value = '';
  }

  function setMySocketId(id: string): void {
    mySocketId.value = id;
  }

  function reset(): void {
    room.value = null;
    voteMap.value = {};
    roundHistory.value = [];
    finalRanking.value = [];
    error.value = '';
    typingText.value = '';
    typingPseudo.value = '';
  }

  return {
    room,
    mySocketId,
    phase,
    currentChallenge,
    challengeOptions,
    challengeChooserSocketId,
    currentBid,
    currentBidderSocketId,
    passedSocketIds,
    currentWords,
    wasForced,
    voteMap,
    roundHistory,
    scores,
    finalRanking,
    error,
    chooseTimerEndsAt,
    bidTimerEndsAt,
    wordsTimerEndsAt,
    typingText,
    typingPseudo,
    isHost,
    myPlayer,
    myPseudo,
    currentBidder,
    challengeChooser,
    activeOthers,
    allPassed,
    hasPassed,
    canBid,
    canChallenge,
    isChallengeChooser,
    canSubmitWords,
    canVote,
    myVote,
    votingProgress,
    setRoom,
    startRound,
    updateBid,
    addPass,
    setVoteUpdate,
    setTimerUpdate,
    setTyping,
    addRoundResult,
    setFinished,
    setError,
    clearError,
    setMySocketId,
    reset,
  };
});
