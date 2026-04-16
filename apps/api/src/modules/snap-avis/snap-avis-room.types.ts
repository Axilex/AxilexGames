import { SnapAvisPlayer, SnapAvisRoom, SnapAvisImage } from '@wiki-race/shared';

/**
 * Internal player type — adds `currentWord` which must NOT be serialized to clients
 * before the RESULTS phase (it is stripped in toDTO).
 */
export interface SnapAvisPlayerInternal extends SnapAvisPlayer {
  currentWord: string | null;
}

/**
 * Internal room type — adds `imageQueue` (future images, secret from clients)
 * and uses `SnapAvisPlayerInternal` for players.
 */
export interface SnapAvisRoomInternal extends Omit<SnapAvisRoom, 'players'> {
  players: SnapAvisPlayerInternal[];
  imageQueue: SnapAvisImage[];
}
