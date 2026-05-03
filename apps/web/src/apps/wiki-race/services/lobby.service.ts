import { socketService } from '@/shared/services/socket.service';

export const lobbyService = {
  createRoom(pseudo: string): void {
    socketService.emit('wikirace:room:create', { pseudo });
  },

  joinRoom(roomCode: string, pseudo: string, sessionToken?: string): void {
    socketService.emit('wikirace:room:join', { roomCode, pseudo, sessionToken });
  },

  leaveRoom(roomCode: string): void {
    socketService.emit('wikirace:room:leave', { roomCode });
  },

  resetRoom(roomCode: string): void {
    socketService.emit('wikirace:room:reset', { roomCode });
  },
};
