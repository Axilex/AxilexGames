import { PlayerStatus } from '@wiki-race/shared';
import { GameChoice } from '@wiki-race/shared';

export interface CommonPlayer {
  socketId: string;
  pseudo: string;
  status: PlayerStatus;
  isHost: boolean;
  /** See `Player.sessionToken` — required to claim a DISCONNECTED slot on reconnect. */
  sessionToken: string | null;
}

export interface CommonRoom {
  code: string;
  status: 'WAITING' | 'IN_GAME';
  gameChoice: GameChoice;
  hostSocketId: string;
  players: Map<string, CommonPlayer>;
}
