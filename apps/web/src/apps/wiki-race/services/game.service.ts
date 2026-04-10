import { socketService } from '@/shared/services/socket.service';

export const gameService = {
  startGame(roomCode: string): void {
    socketService.emit('game:start', { roomCode });
  },

  confirmChoices(
    roomCode: string,
    timeLimitSeconds: number | null,
    startSlug?: string,
    targetSlug?: string,
  ): void {
    socketService.emit('game:confirm_choices', { roomCode, timeLimitSeconds, startSlug, targetSlug });
  },

  navigate(roomCode: string, targetSlug: string): void {
    socketService.emit('game:navigate', { roomCode, targetSlug });
  },

  surrender(roomCode: string): void {
    socketService.emit('game:surrender', { roomCode });
  },
};
