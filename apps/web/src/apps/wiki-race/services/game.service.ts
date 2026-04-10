import { socketService } from '@/shared/services/socket.service';
import type { GameMode, DriftObjective, BingoConstraintId, ChoosingPreviewPayload } from '@wiki-race/shared';

export interface ConfirmChoicesOptions {
  clickLimit?: number | null;
  startSlug?: string;
  targetSlug?: string;
  driftObjective?: DriftObjective;
  bingoConstraintIds?: BingoConstraintId[];
}

export const gameService = {
  startGame(roomCode: string): void {
    socketService.emit('game:start', { roomCode });
  },

  confirmChoices(
    roomCode: string,
    mode: GameMode,
    timeLimitSeconds: number | null,
    options?: ConfirmChoicesOptions,
  ): void {
    socketService.emit('game:confirm_choices', {
      roomCode,
      mode,
      timeLimitSeconds,
      ...options,
    });
  },

  previewChoices(payload: ChoosingPreviewPayload): void {
    socketService.emit('choosing:preview', payload);
  },

  navigate(roomCode: string, targetSlug: string): void {
    socketService.emit('game:navigate', { roomCode, targetSlug });
  },

  surrender(roomCode: string): void {
    socketService.emit('game:surrender', { roomCode });
  },
};
