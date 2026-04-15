import { PlayerStatus } from '@wiki-race/shared';
import { GameChoice } from '@wiki-race/shared';

export interface CommonPlayer {
  socketId: string;
  pseudo: string;
  status: PlayerStatus;
  isHost: boolean;
}

export interface CommonRoom {
  code: string;
  status: 'WAITING' | 'IN_GAME';
  gameChoice: GameChoice;
  hostSocketId: string;
  players: Map<string, CommonPlayer>;
}
