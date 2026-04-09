import { PlayerStatus } from '../domain/enums';

export interface PlayerProgressDTO {
  pseudo: string;
  status: PlayerStatus;
  hopCount: number;
  currentSlug: string;
}
