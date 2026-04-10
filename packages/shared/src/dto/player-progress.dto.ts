import { PlayerStatus } from '../domain/enums';
import { BingoConstraintId } from '../domain/bingo.types';

export interface PlayerProgressDTO {
  pseudo: string;
  status: PlayerStatus;
  hopCount: number;
  currentSlug: string;
  clicksLeft: number | null;
  driftBestScore: number | null;
  driftBestSlug: string | null;
  bingoValidated: BingoConstraintId[];
}
