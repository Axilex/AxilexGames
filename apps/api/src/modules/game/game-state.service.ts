import { Injectable } from '@nestjs/common';

@Injectable()
export class GameStateService {
  private readonly gameTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  startGameTimer(roomCode: string, seconds: number, onExpire: () => void): void {
    this.clearGameTimer(roomCode);
    const handle = setTimeout(onExpire, seconds * 1000).unref();
    this.gameTimers.set(roomCode, handle);
  }

  clearGameTimer(roomCode: string): void {
    const handle = this.gameTimers.get(roomCode);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.gameTimers.delete(roomCode);
    }
  }

  startReconnectTimer(socketId: string, delayMs: number, onExpire: () => void): void {
    this.clearReconnectTimer(socketId);
    const handle = setTimeout(onExpire, delayMs).unref();
    this.reconnectTimers.set(socketId, handle);
  }

  clearReconnectTimer(socketId: string): void {
    const handle = this.reconnectTimers.get(socketId);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.reconnectTimers.delete(socketId);
    }
  }
}
