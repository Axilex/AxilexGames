import { socketService } from '@/shared/services/socket.service';
import type { TelepathieSettings } from '@wiki-race/shared';

export const telepathieSocket = {
  create(pseudo: string): void {
    socketService.emit('telepathie:create', { pseudo });
  },
  join(roomCode: string, pseudo: string, sessionToken?: string): void {
    socketService.emit('telepathie:join', { roomCode, pseudo, sessionToken });
  },
  leave(): void {
    socketService.emit('telepathie:leave', undefined as never);
  },
  start(settings?: Partial<TelepathieSettings>): void {
    socketService.emit('telepathie:start', { settings });
  },
  submit(word: string): void {
    socketService.emit('telepathie:submit', { word });
  },
  chooseWord(word: string): void {
    socketService.emit('telepathie:choose-word', { word });
  },
  nextManche(): void {
    socketService.emit('telepathie:next-manche', undefined as never);
  },
  reset(): void {
    socketService.emit('telepathie:reset', undefined as never);
  },
};
