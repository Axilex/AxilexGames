import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  PlayerStatus,
  type SurenchereRoomDTO,
  type SurenchereGamePhase,
  type SurenchereChallenge,
  type SurenchereRoundResult,
  type SurencherePlayer,
} from '@wiki-race/shared';

export const useSurenchereStore = defineStore('surenchere', () => {
  const room = ref<SurenchereRoomDTO | null>(null);
  const mySocketId = ref<string>('');
  const phase = ref<SurenchereGamePhase>('WAITING');
  const currentChallenge = ref<SurenchereChallenge | null>(null);
  const challengeOptions = ref<SurenchereChallenge[]>([]);
  const challengeChooserSocketId = ref<string | null>(null);
  const currentBid = ref<number>(0);
  const currentBidderSocketId = ref<string | null>(null);
  const passedSocketIds = ref<string[]>([]);
  const currentWords = ref<string[] | null>(null);
  const wasForced = ref<boolean>(false);
  /** Block-vote display map: pseudo → true/false/null (null = not yet voted) */
  const voteMap = ref<Record<string, boolean | null>>({});
  const roundHistory = ref<SurenchereRoundResult[]>([]);
  const scores = ref<Record<string, number>>({});
  const finalRanking = ref<SurencherePlayer[]>([]);
  const error = ref<string>('');
  /** Server timestamp when the bid timer expires. */
  const bidTimerEndsAt = ref<number | null>(null);
  /** Server timestamp when the words timer expires. */
  const wordsTimerEndsAt = ref<number | null>(null);
  /** Live typing from the bidder (phase WORDS, for non-bidder display) */
  const typingText = ref<string>('');
  const typingPseudo = ref<string>('');

  const isHost = computed(() => {
    if (!room.value) return false;
    const me = room.value.players.find((p) => p.socketId === mySocketId.value);
    return !!me?.isHost;
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
      phase.value === 'CHOOSING_CHALLENGE' && mySocketId.value === challengeChooserSocketId.value,
  );

  const canSubmitWords = computed(
    () => phase.value === 'WORDS' && mySocketId.value === currentBidderSocketId.value,
  );

  const canVote = computed(
    () => phase.value === 'VOTING' && mySocketId.value !== currentBidderSocketId.value,
  );

  /** My block vote: true=accept, false=reject, null=not yet voted */
  const myVote = computed(() => voteMap.value[myPseudo.value] ?? null);

  /** Count of eligible voters who have voted */
  const votingProgress = computed(() => {
    if (!room.value) return { voted: 0, total: 0 };
    const voters = room.value.players.filter(
      (p) => p.status === PlayerStatus.CONNECTED && p.socketId !== currentBidderSocketId.value,
    );
    const voted = voters.filter((p) => {
      const pseudo = p.pseudo;
      return voteMap.value[pseudo] !== null && voteMap.value[pseudo] !== undefined;
    }).length;
    return { voted, total: voters.length };
  });

  function setRoom(newRoom: SurenchereRoomDTO): void {
    room.value = newRoom;
    phase.value = newRoom.phase;
    currentChallenge.value = newRoom.currentChallenge;
    challengeOptions.value = [...newRoom.challengeOptions];
    challengeChooserSocketId.value = newRoom.challengeChooserSocketId;
    currentBid.value = newRoom.currentBid;
    currentBidderSocketId.value = newRoom.currentBidderSocketId;
    passedSocketIds.value = [...newRoom.passedSocketIds];
    currentWords.value = newRoom.currentWords ? [...newRoom.currentWords] : null;
    wasForced.value = newRoom.wasForced;
    scores.value = Object.fromEntries(newRoom.players.map((p) => [p.pseudo, p.score]));
    bidTimerEndsAt.value = newRoom.bidTimerEndsAt ?? null;
    wordsTimerEndsAt.value = newRoom.wordsTimerEndsAt ?? null;
    // Reset typing display when phase changes away from WORDS
    if (newRoom.phase !== 'WORDS') {
      typingText.value = '';
      typingPseudo.value = '';
    }
  }

  function startRound(_payload: { round: number; firstBidderSocketId: string }): void {
    currentBid.value = 0;
    currentBidderSocketId.value = null;
    passedSocketIds.value = [];
    currentWords.value = null;
    wasForced.value = false;
    voteMap.value = {};
    bidTimerEndsAt.value = null;
    wordsTimerEndsAt.value = null;
    typingText.value = '';
    typingPseudo.value = '';
  }

  function updateBid(payload: { bidderSocketId: string; amount: number }): void {
    currentBidderSocketId.value = payload.bidderSocketId;
    currentBid.value = payload.amount;
  }

  function addPass(socketId: string): void {
    if (!passedSocketIds.value.includes(socketId)) {
      passedSocketIds.value.push(socketId);
    }
  }

  function setVoteUpdate(votes: Record<string, boolean | null>): void {
    voteMap.value = { ...votes };
  }

  function setTimerUpdate(timerPhase: 'BIDDING' | 'WORDS', endsAt: number): void {
    if (timerPhase === 'BIDDING') bidTimerEndsAt.value = endsAt;
    else wordsTimerEndsAt.value = endsAt;
  }

  function setTyping(payload: { pseudo: string; text: string }): void {
    typingText.value = payload.text;
    typingPseudo.value = payload.pseudo;
  }

  function addRoundResult(result: SurenchereRoundResult, newScores: Record<string, number>): void {
    roundHistory.value.unshift(result);
    scores.value = { ...newScores };
    phase.value = 'ROUND_END';
  }

  function setFinished(payload: {
    scores: Record<string, number>;
    ranked: SurencherePlayer[];
  }): void {
    scores.value = { ...payload.scores };
    finalRanking.value = [...payload.ranked];
    phase.value = 'FINISHED';
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
    phase.value = 'WAITING';
    currentChallenge.value = null;
    challengeOptions.value = [];
    challengeChooserSocketId.value = null;
    currentBid.value = 0;
    currentBidderSocketId.value = null;
    passedSocketIds.value = [];
    currentWords.value = null;
    wasForced.value = false;
    voteMap.value = {};
    roundHistory.value = [];
    scores.value = {};
    finalRanking.value = [];
    error.value = '';
    bidTimerEndsAt.value = null;
    wordsTimerEndsAt.value = null;
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
    bidTimerEndsAt,
    wordsTimerEndsAt,
    typingText,
    typingPseudo,
    isHost,
    myPlayer,
    myPseudo,
    currentBidder,
    challengeChooser,
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
