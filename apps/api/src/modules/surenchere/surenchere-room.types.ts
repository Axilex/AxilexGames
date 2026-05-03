import type { SurencherePlayer, SurenchereRoom } from '@wiki-race/shared';

/**
 * Server-only player type — adds `sessionToken` which is the secret a client
 * must replay to claim a DISCONNECTED slot. Stripped before leaving the
 * server (see `SurenchereService.toDTO`).
 */
export interface SurencherePlayerInternal extends SurencherePlayer {
  sessionToken: string | null;
}

/** Server-internal room — uses `SurencherePlayerInternal`. */
export interface SurenchereRoomInternal extends Omit<SurenchereRoom, 'players'> {
  players: SurencherePlayerInternal[];
}
