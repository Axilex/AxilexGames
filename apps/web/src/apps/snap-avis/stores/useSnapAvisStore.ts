import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  type SnapAvisRoomDTO,
  type SnapAvisPhase,
  type SnapAvisRoundResult,
  type SnapAvisRankEntry,
} from '@wiki-race/shared';
import { socketService } from '@/shared/services/socket.service';

export const useSnapAvisStore = defineStore('snap-avis', () => {
  const room = ref<SnapAvisRoomDTO | null>(null);
  const mySocketId = ref<string>('');
  const phase = ref<SnapAvisPhase>('WAITING');
  const currentImageUrl = ref<string | null>(null);
  const writingEndsAt = ref<number | null>(null);
  const hasSubmitted = ref(false);
  const submittedPseudos = ref<string[]>([]);
  const lastResult = ref<SnapAvisRoundResult | null>(null);
  const rankings = ref<SnapAvisRankEntry[]>([]);
  const error = ref<string>('');

  const isHost = computed(() => {
    if (!room.value || !mySocketId.value) return false;
    return room.value.hostSocketId === mySocketId.value;
  });

  const myPlayer = computed(
    () => room.value?.players.find((p) => p.socketId === mySocketId.value) ?? null,
  );

  const myPseudo = computed(() => myPlayer.value?.pseudo ?? '');

  const myScore = computed(() => myPlayer.value?.score ?? 0);

  /** Phase active = partie en cours (pas lobby, pas podium) */
  const isActive = computed(() =>
    (['REVEALING', 'WRITING', 'RESULTS', 'ROUND_END'] as SnapAvisPhase[]).includes(phase.value),
  );

  const canGoNextRound = computed(
    () =>
      isHost.value &&
      phase.value === 'RESULTS' &&
      room.value !== null &&
      room.value.currentRound < room.value.settings.totalRounds,
  );

  function setMySocketId(id: string): void {
    mySocketId.value = id;
  }

  function setRoom(dto: SnapAvisRoomDTO): void {
    room.value = dto;
    phase.value = dto.phase;
    writingEndsAt.value = dto.writingTimerEndsAt;
  }

  function onRoundStart(data: { round: number; total: number; imageUrl: string }): void {
    phase.value = 'REVEALING';
    currentImageUrl.value = data.imageUrl;
    hasSubmitted.value = false;
    submittedPseudos.value = [];
    lastResult.value = null;
    writingEndsAt.value = null;
    rankings.value = [];
    void data; // round/total available from room
  }

  function onWritingStart(data: { endsAt: number }): void {
    phase.value = 'WRITING';
    writingEndsAt.value = data.endsAt;
  }

  function onWordReceived(data: { pseudo: string }): void {
    if (!submittedPseudos.value.includes(data.pseudo)) {
      submittedPseudos.value.push(data.pseudo);
    }
    if (data.pseudo === myPseudo.value) {
      hasSubmitted.value = true;
    }
  }

  function onResults(result: SnapAvisRoundResult): void {
    phase.value = 'RESULTS';
    lastResult.value = result;
  }

  function onGameFinished(data: { rankings: SnapAvisRankEntry[] }): void {
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
    currentImageUrl.value = null;
    writingEndsAt.value = null;
    hasSubmitted.value = false;
    submittedPseudos.value = [];
    lastResult.value = null;
    rankings.value = [];
    error.value = '';
  }

  return {
    room,
    mySocketId,
    phase,
    currentImageUrl,
    writingEndsAt,
    hasSubmitted,
    submittedPseudos,
    lastResult,
    rankings,
    error,
    isHost,
    myPlayer,
    myPseudo,
    myScore,
    isActive,
    canGoNextRound,
    setMySocketId,
    setRoom,
    onRoundStart,
    onWritingStart,
    onWordReceived,
    onResults,
    onGameFinished,
    setError,
    clearError,
    reset,
  };
});
