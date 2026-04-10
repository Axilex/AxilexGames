import { NavigationStep } from './wikipedia.types';
import { GameMode, DriftObjective } from './enums';
import { BingoConstraintId, BingoCardEntry } from './bingo.types';

export interface PlayerSummary {
  pseudo: string;
  isWinner: boolean;
  surrendered: boolean;
  hopCount: number;
  path: NavigationStep[];
  rank: number | null;
  driftBestScore: number | null;
  driftBestSlug: string | null;
  bingoValidated: BingoConstraintId[];
  bingoCardEntries: BingoCardEntry[];
}

export interface GameSummary {
  roomCode: string;
  mode: GameMode;
  startSlug: string;
  targetSlug: string | null;
  startTime: number;
  endTime: number;
  timeLimitSeconds: number | null;
  clickLimit: number | null;
  winnerPseudo: string | null;
  driftObjective: DriftObjective | null;
  bingoConstraintIds: BingoConstraintId[] | null;
  players: PlayerSummary[];
}
