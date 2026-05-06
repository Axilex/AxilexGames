import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';

/**
 * Socket.IO adapter that lifts the per-socket `disconnect` listener cap.
 *
 * `@nestjs/websockets` registers one `disconnect` listener per gateway on every
 * connected socket. With more than 10 gateways (lobby, game, surenchere,
 * snap-avis, telepathie, common-lobby, wiki-race, bug-matrix, …) Node's default
 * `MaxListeners = 10` triggers a `MaxListenersExceededWarning` on each connect.
 *
 * Bumping it to 32 leaves comfortable headroom for the foreseeable game roster
 * without masking real listener leaks (a runaway listener would still cross 32).
 */
const SOCKET_MAX_LISTENERS = 32;

export class AxilexIoAdapter extends IoAdapter {
  constructor(appOrHttpServer?: INestApplicationContext | unknown) {
    super(appOrHttpServer as INestApplicationContext);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, options);
    server.on('connection', (socket) => {
      socket.setMaxListeners(SOCKET_MAX_LISTENERS);
    });
    return server;
  }
}
