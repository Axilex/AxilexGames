import { GameStatus } from '../domain/enums';
import { PlayerDTO } from './player.dto';

export interface RoomDTO {
  code: string;
  status: GameStatus;
  players: PlayerDTO[];
  hostPseudo: string;
}
