import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  TelepathieRoomDTO,
  TelepathiePhase,
  TelepathieSousRoundResult,
  TelepathieMancheResult,
  TelepathieRankEntry,
} from '@wiki-race/shared';
import { socketService } from '@/shared/services/socket.service';

export const useTelepathieStore = defineStore('telepathie', () => {
  const room = ref<TelepathieRoomDTO | null>(null);
  const mySocketId = ref<string>('');
  const phase = ref<TelepathiePhase>('WAITING');
  const inputEndsAt = ref<number | null>(null);
  const hasSubmitted = ref(false);
  const hasChosen = ref(false);
  const submittedPseudos = ref<string[]>([]);
  const lastRoundResult = ref<TelepathieSousRoundResult | null>(null);
  const lastMancheResult = ref<TelepathieMancheResult | null>(null);
  const rankings = ref<TelepathieRankEntry[]>([]);
  const error = ref<string>('');

  const isHost = computed(() => {
    if (!room.value || !mySocketId.value) return false;
    return room.value.hostSocketId === mySocketId.value;
  });

  const myPlayer = computed(
    () => room.value?.players.find((p) => p.socketId === mySocketId.value) ?? null,
  );

  const myPseudo = computed(() => myPlayer.value?.pseudo ?? '');
  const myWord = computed(() => myPlayer.value?.currentWord ?? null);
  const myScore = computed(() => myPlayer.value?.score ?? 0);

  const isActive = computed(() =>
    (['CHOOSING', 'PLAYING', 'ROUND_RESULT', 'MANCHE_RESULT'] as TelepathiePhase[]).includes(
      phase.value,
    ),
  );

  const canNextManche = computed(
    () => isHost.value && phase.value === 'MANCHE_RESULT' && room.value !== null,
  );

  function setMySocketId(id: string): void {
    mySocketId.value = id;
  }

  function setRoom(dto: TelepathieRoomDTO): void {
    room.value = dto;
    phase.value = dto.phase;
    if (dto.roundTimerEndsAt) {
      inputEndsAt.value = dto.roundTimerEndsAt;
    }
    if (dto.lastRoundResult) {
      lastRoundResult.value = dto.lastRoundResult;
    }
  }

  function onInputOpen(data: { endsAt: number }): void {
    phase.value = 'PLAYING';
    inputEndsAt.value = data.endsAt;
    hasSubmitted.value = false;
    submittedPseudos.value = [];
    lastRoundResult.value = null;
  }

  function onChooseOpen(data: { endsAt: number }): void {
    phase.value = 'CHOOSING';
    inputEndsAt.value = data.endsAt;
    hasChosen.value = false;
  }

  function markChosen(): void {
    hasChosen.value = true;
  }

  function onWordReceived(data: { pseudo: string }): void {
    if (!submittedPseudos.value.includes(data.pseudo)) {
      submittedPseudos.value.push(data.pseudo);
    }
    if (data.pseudo === myPseudo.value) {
      hasSubmitted.value = true;
    }
  }

  function onRoundResult(result: TelepathieSousRoundResult): void {
    phase.value = 'ROUND_RESULT';
    lastRoundResult.value = result;
    inputEndsAt.value = null;
  }

  function onMancheResult(result: TelepathieMancheResult): void {
    lastMancheResult.value = result;
  }

  function onGameFinished(data: { rankings: TelepathieRankEntry[] }): void {
    phase.value = 'FINISHED';
    rankings.value = data.rankings;
  }

  function setError(msg: string): void {
    error.value = msg;
  }

  function clearError(): void {
    error.value = '';
  }

  function reset(): void {
    room.value = null;
    mySocketId.value = socketService.id ?? '';
    phase.value = 'WAITING';
    inputEndsAt.value = null;
    hasSubmitted.value = false;
    hasChosen.value = false;
    submittedPseudos.value = [];
    lastRoundResult.value = null;
    lastMancheResult.value = null;
    rankings.value = [];
    error.value = '';
  }

  return {
    room,
    mySocketId,
    phase,
    inputEndsAt,
    hasSubmitted,
    hasChosen,
    submittedPseudos,
    lastRoundResult,
    lastMancheResult,
    rankings,
    error,
    isHost,
    myPlayer,
    myPseudo,
    myWord,
    myScore,
    isActive,
    canNextManche,
    setMySocketId,
    setRoom,
    onInputOpen,
    onChooseOpen,
    markChosen,
    onWordReceived,
    onRoundResult,
    onMancheResult,
    onGameFinished,
    setError,
    clearError,
    reset,
  };
});
