import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();
    const raw =
      exception instanceof WsException
        ? exception.getError()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';
    const message = typeof raw === 'string' ? raw : JSON.stringify(raw);

    // Match the `{ code, message }` shape of the per-game `*:error` events so
    // the frontend has a single error payload contract to handle.
    client.emit('error', { code: message, message });
  }
}
