import type { GatewayMetadata } from '@nestjs/websockets';

/**
 * Single source of truth for allowed CORS origins. Used by both the Socket.IO
 * gateway config and `app.enableCors()` in `main.ts` so they cannot drift.
 */
export const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

/**
 * Shared Socket.IO gateway config. Every game gateway uses these settings so
 * ping cadence, transport list and CORS stay in sync across modules.
 *
 * `transports: ['websocket']` (no long-polling fallback) is intentional: the
 * documented deployment stack (Caddy / Render / Cloud Run) supports WS natively
 * and skipping the polling handshake removes a round-trip on connect. Networks
 * that strip WebSocket upgrades will fail to connect — if that becomes an
 * issue, add `'polling'` here AND keep `transports: ['websocket']` on the
 * client (`apps/web/src/shared/services/socket.service.ts`) in sync.
 */
export const GAME_GATEWAY_CONFIG: GatewayMetadata = {
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket'],
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
};

export const RECONNECT_TIMEOUT_MS = 30_000;
