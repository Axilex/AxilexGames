import type { GatewayMetadata } from '@nestjs/websockets';

export const GAME_GATEWAY_CONFIG: GatewayMetadata = {
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket'],
  cors: {
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    credentials: true,
  },
};

export const RECONNECT_TIMEOUT_MS = 30_000;
