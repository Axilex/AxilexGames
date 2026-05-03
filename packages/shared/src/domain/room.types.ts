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
  /**
   * Per-player secret issued on first join. Required to claim a DISCONNECTED
   * slot on reconnect — prevents anyone with the room code + a known pseudo
   * from hijacking the session. Server-side only; never serialised in DTOs.
   * Null while the player is still a seed (created by common-lobby redirect
   * before the real socket joins).
   */
  sessionToken: string | null;
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
