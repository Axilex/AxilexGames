import { PlayerProgressDTO } from './player-progress.dto';
import { GameMode, DriftObjective } from '../domain/enums';
import { BingoConstraintId } from '../domain/bingo.types';

export interface GameStateDTO {
  roomCode: string;
  mode: GameMode;
  startSlug: string;
  targetSlug: string | null;
  startTime: number;
  timeLimitSeconds: number | null;
  clickLimit: number | null;
  driftObjective: DriftObjective | null;
  bingoConstraints: BingoConstraintId[] | null;
  playerStatuses: PlayerProgressDTO[];
}
