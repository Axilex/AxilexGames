import { gameService } from '../services/game.service';
import { useGameStore } from '../stores/useGameStore';
import { useSessionStore } from '@/shared/stores/useSessionStore';

export function useGameSession() {
  const gameStore = useGameStore();
  const sessionStore = useSessionStore();

  function startGame(): void {
    const roomCode = sessionStore.roomCode;
    if (!roomCode) return;
    gameService.startGame(roomCode);
  }

  function confirmChoices(
    timeLimitSeconds: number | null,
    startSlug?: string,
    targetSlug?: string,
  ): void {
    const roomCode = sessionStore.roomCode;
    if (!roomCode) return;
    gameService.confirmChoices(roomCode, timeLimitSeconds, startSlug, targetSlug);
  }

  function navigate(targetSlug: string): void {
    const roomCode = sessionStore.roomCode;
    if (!roomCode) return;
    gameStore.setNavigating();
    gameService.navigate(roomCode, targetSlug);
  }

  function surrender(): void {
    const roomCode = sessionStore.roomCode;
    if (!roomCode) return;
    gameService.surrender(roomCode);
  }

  return { startGame, confirmChoices, navigate, surrender, gameStore };
}
