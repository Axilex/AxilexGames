import type { BugMatrixSettings, BugMatrixVoteLabel } from '@wiki-race/shared';
import { socketService } from '@/shared/services/socket.service';

export const bugMatrixSocket = {
  create(pseudo: string, settings?: Partial<BugMatrixSettings>): void {
    socketService.emit('bugmatrix:room-create', { pseudo, settings });
  },
  join(roomCode: string, pseudo: string, sessionToken?: string): void {
    socketService.emit('bugmatrix:room-join', { roomCode, pseudo, sessionToken });
  },
  leave(): void {
    socketService.emit('bugmatrix:room-leave', undefined as never);
  },
  start(settings?: Partial<BugMatrixSettings>): void {
    socketService.emit('bugmatrix:game-start', { settings });
  },
  submitVote(votes: Record<string, BugMatrixVoteLabel>): void {
    socketService.emit('bugmatrix:vote-submit', { votes });
  },
  reset(): void {
    socketService.emit('bugmatrix:room-reset', undefined as never);
  },
};
