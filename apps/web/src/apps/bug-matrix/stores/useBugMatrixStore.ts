import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  type BugMatrixPhase,
  type BugMatrixQuestion,
  type BugMatrixRankEntry,
  type BugMatrixRole,
  type BugMatrixRoomDTO,
  type BugMatrixRoundResult,
  type BugMatrixRuleCategory,
  type BugMatrixVoteLabel,
} from '@wiki-race/shared';

export const useBugMatrixStore = defineStore('bug-matrix', () => {
  // ── Source of truth ──────────────────────────────────────────────────────────
  const room = ref<BugMatrixRoomDTO | null>(null);
  const mySocketId = ref<string>('');

  // ── Side-channel state (delivered via unicast / one-shot events) ─────────────
  const myRole = ref<BugMatrixRole | null>(null);
  const myRuleLabel = ref<string>('');
  const myRuleCategory = ref<BugMatrixRuleCategory | null>(null);
  /** The current discussion question, also mirrored on `room.currentQuestion` once room-update lands. */
  const currentQuestion = ref<BugMatrixQuestion | null>(null);
  /** Phase + endsAt, as conveyed by `bugmatrix:phase-start`. */
  const phaseTimerEndsAt = ref<number | null>(null);
  /** Local pending votes selected during VOTE before submit. */
  const pendingVotes = ref<Record<string, BugMatrixVoteLabel>>({});
  /** Set after vote submitted to lock the panel. */
  const hasSubmittedVote = ref<boolean>(false);
  const finalRanking = ref<BugMatrixRankEntry[]>([]);
  const error = ref<string>('');

  // ── Computed from room ───────────────────────────────────────────────────────
  const phase = computed<BugMatrixPhase>(() => room.value?.phase ?? 'WAITING');
  const themeLabel = computed(() => room.value?.themeLabel ?? '');
  const lastResult = computed<BugMatrixRoundResult | null>(() => room.value?.lastResult ?? null);

  const myPlayer = computed(() =>
    room.value?.players.find((p) => p.socketId === mySocketId.value) ?? null,
  );
  const myPseudo = computed(() => myPlayer.value?.pseudo ?? '');
  const isHost = computed(() => myPlayer.value?.isHost ?? false);

  /** Other players: targets of voting and reveal. */
  const voteTargets = computed(() => {
    if (!room.value) return [];
    return room.value.players.filter((p) => p.pseudo !== myPseudo.value);
  });

  /** True only when every other player has been labeled. */
  const canSubmitVote = computed(() => {
    if (phase.value !== 'VOTE') return false;
    if (hasSubmittedVote.value) return false;
    return voteTargets.value.every((t) => Boolean(pendingVotes.value[t.pseudo]));
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  function setRoom(newRoom: BugMatrixRoomDTO): void {
    room.value = newRoom;
    if (newRoom.currentQuestion) currentQuestion.value = newRoom.currentQuestion;
    // Reset secrets when leaving game phases
    if (newRoom.phase === 'WAITING') {
      myRole.value = null;
      myRuleLabel.value = '';
      myRuleCategory.value = null;
      currentQuestion.value = null;
      pendingVotes.value = {};
      hasSubmittedVote.value = false;
    }
    // Reset vote panel when leaving VOTE
    if (newRoom.phase !== 'VOTE') {
      hasSubmittedVote.value = false;
    }
  }

  function setMySocketId(id: string): void {
    mySocketId.value = id;
  }

  function setMyRole(
    role: BugMatrixRole,
    ruleLabel?: string,
    ruleCategory?: BugMatrixRuleCategory,
  ): void {
    myRole.value = role;
    myRuleLabel.value = ruleLabel ?? '';
    myRuleCategory.value = ruleCategory ?? null;
  }

  function setCurrentQuestion(q: BugMatrixQuestion): void {
    currentQuestion.value = q;
  }

  function setPhaseTimer(p: BugMatrixPhase, endsAt: number): void {
    phaseTimerEndsAt.value = endsAt;
    // Clear pending state when entering VOTE
    if (p === 'VOTE') {
      pendingVotes.value = {};
      hasSubmittedVote.value = false;
    }
  }

  function setPendingVote(target: string, label: BugMatrixVoteLabel): void {
    pendingVotes.value = { ...pendingVotes.value, [target]: label };
  }

  function clearPendingVotes(): void {
    pendingVotes.value = {};
  }

  function markVoteSubmitted(): void {
    hasSubmittedVote.value = true;
  }

  function setFinished(rankings: BugMatrixRankEntry[]): void {
    finalRanking.value = [...rankings];
  }

  function setError(msg: string): void {
    error.value = msg;
  }

  function clearError(): void {
    error.value = '';
  }

  function reset(): void {
    room.value = null;
    myRole.value = null;
    myRuleLabel.value = '';
    myRuleCategory.value = null;
    currentQuestion.value = null;
    phaseTimerEndsAt.value = null;
    pendingVotes.value = {};
    hasSubmittedVote.value = false;
    finalRanking.value = [];
    error.value = '';
  }

  return {
    room,
    mySocketId,
    myRole,
    myRuleLabel,
    myRuleCategory,
    currentQuestion,
    phaseTimerEndsAt,
    pendingVotes,
    hasSubmittedVote,
    finalRanking,
    error,
    phase,
    themeLabel,
    lastResult,
    myPlayer,
    myPseudo,
    isHost,
    voteTargets,
    canSubmitVote,
    setRoom,
    setMySocketId,
    setMyRole,
    setCurrentQuestion,
    setPhaseTimer,
    setPendingVote,
    clearPendingVotes,
    markVoteSubmitted,
    setFinished,
    setError,
    clearError,
    reset,
  };
});
