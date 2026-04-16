import { Injectable } from '@nestjs/common';

/**
 * Gère les timers de Télépathie.
 * Utilise .unref() pour ne pas bloquer l'arrêt du process.
 */
@Injectable()
export class TelepathieTimerService {
  private readonly roundTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly autoNextTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly chooseTimers = new Map<string, ReturnType<typeof setTimeout>>();

  startRoundTimer(roomCode: string, seconds: number, onExpire: () => void): void {
    this.clearRoundTimer(roomCode);
    const handle = setTimeout(onExpire, seconds * 1000);
    handle.unref();
    this.roundTimers.set(roomCode, handle);
  }

  clearRoundTimer(roomCode: string): void {
    const handle = this.roundTimers.get(roomCode);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.roundTimers.delete(roomCode);
    }
  }

  /** Timer de transition automatique entre sous-rounds (3s) */
  startAutoNextTimer(roomCode: string, ms: number, onExpire: () => void): void {
    this.clearAutoNextTimer(roomCode);
    const handle = setTimeout(onExpire, ms);
    handle.unref();
    this.autoNextTimers.set(roomCode, handle);
  }

  clearAutoNextTimer(roomCode: string): void {
    const handle = this.autoNextTimers.get(roomCode);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.autoNextTimers.delete(roomCode);
    }
  }

  clearAllTimers(roomCode: string): void {
    this.clearRoundTimer(roomCode);
    this.clearAutoNextTimer(roomCode);
    this.clearChooseTimer(roomCode);
  }

  startChooseTimer(roomCode: string, seconds: number, onExpire: () => void): void {
    this.clearChooseTimer(roomCode);
    const handle = setTimeout(onExpire, seconds * 1000);
    handle.unref();
    this.chooseTimers.set(roomCode, handle);
  }

  clearChooseTimer(roomCode: string): void {
    const handle = this.chooseTimers.get(roomCode);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.chooseTimers.delete(roomCode);
    }
  }
}
