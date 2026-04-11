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
  const roundHistory = ref<SurenchereRoundResult[]>([]);
  const scores = ref<Record<string, number>>({});
  const finalRanking = ref<SurencherePlayer[]>([]);
  const error = ref<string>('');

  const isHost = computed(() => {
    if (!room.value) return false;
    const me = room.value.players.find((p) => p.socketId === mySocketId.value);
    return !!me?.isHost;
  });

  const myPlayer = computed(
    () => room.value?.players.find((p) => p.socketId === mySocketId.value) ?? null,
  );

  const currentBidder = computed(
    () =>
      room.value?.players.find((p) => p.socketId === currentBidderSocketId.value) ?? null,
  );

  const challengeChooser = computed(
    () =>
      room.value?.players.find((p) => p.socketId === challengeChooserSocketId.value) ?? null,
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
  }

  function startRound(_payload: { round: number; firstBidderSocketId: string }): void {
    currentBid.value = 0;
    currentBidderSocketId.value = null;
    passedSocketIds.value = [];
    currentWords.value = null;
    wasForced.value = false;
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

  function addRoundResult(
    result: SurenchereRoundResult,
    newScores: Record<string, number>,
  ): void {
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
    roundHistory.value = [];
    scores.value = {};
    finalRanking.value = [];
    error.value = '';
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
    roundHistory,
    scores,
    finalRanking,
    error,
    isHost,
    myPlayer,
    currentBidder,
    challengeChooser,
    allPassed,
    hasPassed,
    canBid,
    canChallenge,
    isChallengeChooser,
    canSubmitWords,
    setRoom,
    startRound,
    updateBid,
    addPass,
    addRoundResult,
    setFinished,
    setError,
    clearError,
    setMySocketId,
    reset,
  };
});
