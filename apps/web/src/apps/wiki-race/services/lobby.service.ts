import { socketService } from '@/shared/services/socket.service';

export const lobbyService = {
  createRoom(pseudo: string): void {
    socketService.emit('room:create', { pseudo });
  },

  joinRoom(roomCode: string, pseudo: string): void {
    socketService.emit('room:join', { roomCode, pseudo });
  },

  leaveRoom(roomCode: string): void {
    socketService.emit('room:leave', { roomCode });
  },

  resetRoom(roomCode: string): void {
    socketService.emit('room:reset', { roomCode });
  },
};
