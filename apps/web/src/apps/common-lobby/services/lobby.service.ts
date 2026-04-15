import { socketService } from '@/shared/services/socket.service';

export const lobbySocket = {
  create(pseudo: string): void {
    socketService.emit('lobby:create', { pseudo });
  },
  join(roomCode: string, pseudo: string): void {
    socketService.emit('lobby:join', { roomCode, pseudo });
  },
  leave(): void {
    socketService.emit('lobby:leave', undefined as never);
  },
  chooseGame(game: 'wikirace' | 'surenchere'): void {
    socketService.emit('lobby:choose-game', { game });
  },
  start(): void {
    socketService.emit('lobby:start', undefined as never);
  },
};
