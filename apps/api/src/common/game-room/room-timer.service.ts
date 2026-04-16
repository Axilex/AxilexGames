import { Injectable } from '@nestjs/common';

/**
 * Generic, reusable timer manager for game rooms.
 *
 * Each room can have multiple named timers (e.g. 'reveal', 'writing', 'bid').
 * Timers are identified by composite keys `${roomCode}:${name}`.
 * All timers use `.unref()` so they never block process shutdown.
 *
 * Provide one instance per game module so timer keys remain isolated.
 */
@Injectable()
export class RoomTimerService {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Starts a named timer for a room. Any existing timer with the same
   * (roomCode, name) pair is cancelled first.
   */
  start(roomCode: string, name: string, ms: number, onExpire: () => void): void {
    const key = `${roomCode}:${name}`;
    const existing = this.timers.get(key);
    if (existing !== undefined) clearTimeout(existing);

    const handle = setTimeout(() => {
      this.timers.delete(key);
      onExpire();
    }, ms);
    handle.unref();
    this.timers.set(key, handle);
  }

  /** Cancels the named timer for a room (no-op if none). */
  clear(roomCode: string, name: string): void {
    const key = `${roomCode}:${name}`;
    const handle = this.timers.get(key);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timers.delete(key);
    }
  }

  /** Cancels ALL timers for a room. */
  clearAll(roomCode: string): void {
    const prefix = `${roomCode}:`;
    for (const key of this.timers.keys()) {
      if (key.startsWith(prefix)) {
        clearTimeout(this.timers.get(key)!);
        this.timers.delete(key);
      }
    }
  }
}
