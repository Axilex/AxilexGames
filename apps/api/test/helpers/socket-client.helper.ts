import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@wiki-race/shared';

export type TestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createClient(port: number): TestSocket {
  return io(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    autoConnect: false,
  });
}

export function connectClient(socket: TestSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
    socket.connect();
  });
}

export function waitForEvent<K extends keyof ServerToClientEvents>(
  socket: TestSocket,
  event: K,
  timeoutMs = 3000,
): Promise<Parameters<ServerToClientEvents[K]>[0]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for "${String(event)}" on socket ${socket.id}`)),
      timeoutMs,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).once(event, (data: Parameters<ServerToClientEvents[K]>[0]) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

export function disconnectAll(...sockets: TestSocket[]): void {
  for (const s of sockets) {
    if (s.connected) s.disconnect();
  }
}
