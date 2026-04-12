import { socketService } from '@/shared/services/socket.service';

export const surenchereSocket = {
  create(pseudo: string, settings?: { totalRounds: number; startBid: number }): void {
    socketService.emit('surenchere:create', { pseudo, settings });
  },
  join(roomCode: string, pseudo: string): void {
    socketService.emit('surenchere:join', { roomCode, pseudo });
  },
  leave(): void {
    socketService.emit('surenchere:leave', undefined as never);
  },
  start(): void {
    socketService.emit('surenchere:start', undefined as never);
  },
  bid(amount: number): void {
    socketService.emit('surenchere:bid', { amount });
  },
  pass(): void {
    socketService.emit('surenchere:pass', undefined as never);
  },
  challenge(): void {
    socketService.emit('surenchere:challenge', undefined as never);
  },
  chooseChallenge(options: { challengeId?: string; customPhrase?: string }): void {
    socketService.emit('surenchere:choose_challenge', options);
  },
  submitWords(words: string[]): void {
    socketService.emit('surenchere:submit_words', { words });
  },
  verdict(success: boolean): void {
    socketService.emit('surenchere:verdict', { success });
  },
  reset(): void {
    socketService.emit('surenchere:reset', undefined as never);
  },
};
