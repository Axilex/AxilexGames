import { socketService } from '@/shared/services/socket.service';

export const snapAvisSocket = {
  create(pseudo: string): void {
    socketService.emit('snapavis:create', { pseudo });
  },
  join(roomCode: string, pseudo: string): void {
    socketService.emit('snapavis:join', { roomCode, pseudo });
  },
  leave(): void {
    socketService.emit('snapavis:leave', undefined as never);
  },
  start(settings?: { totalRounds?: number; writingDurationMs?: number }): void {
    socketService.emit('snapavis:start', { settings });
  },
  submitWord(word: string): void {
    socketService.emit('snapavis:submit-word', { word });
  },
  nextRound(): void {
    socketService.emit('snapavis:next-round', undefined as never);
  },
  reset(): void {
    socketService.emit('snapavis:reset', undefined as never);
  },
};
