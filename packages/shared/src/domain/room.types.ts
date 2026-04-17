import { GameStatus, PlayerStatus, GameMode } from './enums';
import { NavigationStep } from './wikipedia.types';
import { BingoConstraintId } from './bingo.types';

export interface Player {
  socketId: string;
  pseudo: string;
  status: PlayerStatus;
  currentSlug: string;
  history: NavigationStep[];
  lastNavigationAt: number;
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
  targetSlug: string | null; // null for BINGO
  startTime: number;
  endTime: number | null;
  timeLimitSeconds: number | null;
  clickLimit: number | null; // null for CLASSIC
  winnerSocketId: string | null;
  // Bingo
  bingoConstraintIds: BingoConstraintId[] | null;
}
