import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@wiki-race/shared';

const SOCKET_URL =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? 'http://localhost:3000';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(): void {
    if (this.socket?.connected) return;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    payload: Parameters<ClientToServerEvents[E]>[0],
  ): void {
    this.socket?.emit(event, ...([payload] as unknown as Parameters<ClientToServerEvents[E]>));
  }

  on<E extends keyof ServerToClientEvents>(event: E, listener: ServerToClientEvents[E]): void {
    this.socket?.on(event, listener as never);
  }

  off<E extends keyof ServerToClientEvents>(event: E, listener?: ServerToClientEvents[E]): void {
    this.socket?.off(event, listener as never);
  }

  /** Listen to a raw socket.io lifecycle event (connect, disconnect, etc.) */
  onLifecycle(event: 'connect' | 'disconnect' | 'connect_error', listener: () => void): void {
    this.socket?.on(event as never, listener as never);
  }

  offLifecycle(event: 'connect' | 'disconnect' | 'connect_error', listener: () => void): void {
    this.socket?.off(event as never, listener as never);
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
