import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class WsLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('WsGateway');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const client = context.switchToWs().getClient<{ id: string }>();
    const data = context.switchToWs().getData<unknown>();
    const handler = context.getHandler().name;

    this.logger.debug(`[${client.id}] ${handler} ${JSON.stringify(data)}`);

    return next.handle().pipe(
      tap({
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`[${client.id}] ${handler} error: ${message}`);
        },
      }),
    );
  }
}
