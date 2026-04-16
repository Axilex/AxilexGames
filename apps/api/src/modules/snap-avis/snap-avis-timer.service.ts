import { Injectable } from '@nestjs/common';

/**
 * Gère les timers de phase pour chaque room Snap Avis.
 * Tous les timers utilisent .unref() pour ne pas bloquer l'arrêt du process.
 */
@Injectable()
export class SnapAvisTimerService {
  private readonly revealTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly writingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  startRevealTimer(roomCode: string, durationMs: number, onExpire: () => void): void {
    this.clearRevealTimer(roomCode);
    const handle = setTimeout(onExpire, durationMs);
    handle.unref();
    this.revealTimers.set(roomCode, handle);
  }

  startWritingTimer(roomCode: string, durationMs: number, onExpire: () => void): void {
    this.clearWritingTimer(roomCode);
    const handle = setTimeout(onExpire, durationMs);
    handle.unref();
    this.writingTimers.set(roomCode, handle);
  }

  clearRevealTimer(roomCode: string): void {
    const handle = this.revealTimers.get(roomCode);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.revealTimers.delete(roomCode);
    }
  }

  clearWritingTimer(roomCode: string): void {
    const handle = this.writingTimers.get(roomCode);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.writingTimers.delete(roomCode);
    }
  }

  clearAllTimers(roomCode: string): void {
    this.clearRevealTimer(roomCode);
    this.clearWritingTimer(roomCode);
  }
}
