import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CommonRoomDTO, GameChoice } from '@wiki-race/shared';
import { useCommonSessionStore } from '@/shared/stores/useCommonSessionStore';

export const useCommonLobbyStore = defineStore('common-lobby', () => {
  const room = ref<CommonRoomDTO | null>(null);
  const error = ref<string>('');

  const session = useCommonSessionStore();

  const myPseudo = computed(() => session.pseudo);
  const isHost = computed(() => !!room.value && room.value.hostPseudo === myPseudo.value);
  const gameChoice = computed<GameChoice>(() => room.value?.gameChoice ?? null);
  const connectedCount = computed(
    () => room.value?.players.filter((p) => p.status === 'CONNECTED').length ?? 0,
  );
  const canStart = computed(
    () => isHost.value && !!gameChoice.value && connectedCount.value >= 2,
  );

  /** Human-readable reason the start button is disabled, or null if startable. */
  const startBlockedReason = computed<string | null>(() => {
    if (!isHost.value) return null;
    if (!gameChoice.value) return 'Choisis un jeu pour pouvoir lancer la partie.';
    if (connectedCount.value < 2) {
      return 'En attente d\u2019un autre joueur (minimum 2 pour lancer).';
    }
    return null;
  });

  function setRoom(r: CommonRoomDTO): void {
    room.value = r;
    error.value = '';
  }

  function setError(code: string): void {
    error.value = code;
  }

  function clearError(): void {
    error.value = '';
  }

  function reset(): void {
    room.value = null;
    error.value = '';
  }

  return {
    room,
    error,
    myPseudo,
    isHost,
    gameChoice,
    connectedCount,
    canStart,
    startBlockedReason,
    setRoom,
    setError,
    clearError,
    reset,
  };
});
