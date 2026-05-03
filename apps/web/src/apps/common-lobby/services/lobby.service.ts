import { socketService } from '@/shared/services/socket.service';

export const lobbySocket = {
  create(pseudo: string): void {
    socketService.emit('lobby:create', { pseudo });
  },
  join(roomCode: string, pseudo: string, sessionToken?: string): void {
    socketService.emit('lobby:join', { roomCode, pseudo, sessionToken });
  },
  leave(): void {
    socketService.emit('lobby:leave', undefined as never);
  },
  chooseGame(game: 'wikirace' | 'surenchere' | 'snap-avis' | 'telepathie'): void {
    socketService.emit('lobby:choose-game', { game });
  },
  clearGame(): void {
    socketService.emit('lobby:clear-game', undefined as never);
  },
  start(): void {
    socketService.emit('lobby:start', undefined as never);
  },
  reset(): void {
    socketService.emit('lobby:reset', undefined as never);
  },
};
