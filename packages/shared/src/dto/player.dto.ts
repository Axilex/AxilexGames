import { PlayerStatus } from '../domain/enums';

export interface PlayerDTO {
  pseudo: string;
  status: PlayerStatus;
  isHost: boolean;
}
