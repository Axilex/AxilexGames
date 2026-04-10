import { GameStatus, PlayerStatus, GameMode, DriftObjective } from './enums';
import { NavigationStep } from './wikipedia.types';
import { BingoConstraintId } from './bingo.types';

export interface Player {
  socketId: string;
  pseudo: string;
  status: PlayerStatus;
  currentSlug: string;
  history: NavigationStep[];
  lastNavigationAt: number;
  disconnectTimer?: ReturnType<typeof setTimeout>;
  // Drift
  driftBestScore: number | null;
  driftBestSlug: string | null;
  // Bingo
  bingoValidated: BingoConstraintId[];
  bingoValidatedOnSlug: Partial<Record<BingoConstraintId, string>>;
}

export interface Room {
  code: string;
  hostSocketId: string;
  chooserSocketId: string | null;
  players: Map<string, Player>; // keyed by socketId
  status: GameStatus;
  game: GameSession | null;
}

export interface GameSession {
  mode: GameMode;
  startSlug: string;
  targetSlug: string | null; // null for DRIFT and BINGO
  startTime: number;
  endTime: number | null;
  timeLimitSeconds: number | null;
  clickLimit: number | null; // null for CLASSIC and SPRINT
  winnerSocketId: string | null;
  timerHandle: ReturnType<typeof setTimeout> | null;
  // Drift
  driftObjective: DriftObjective | null;
  // Bingo
  bingoConstraintIds: BingoConstraintId[] | null;
}
