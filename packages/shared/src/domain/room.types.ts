import { GameStatus, PlayerStatus } from './enums';
import { NavigationStep } from './wikipedia.types';

export interface Player {
  socketId: string;
  pseudo: string;
  status: PlayerStatus;
  currentSlug: string;
  history: NavigationStep[];
  lastNavigationAt: number;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

export interface Room {
  code: string;
  hostSocketId: string;
  players: Map<string, Player>; // keyed by socketId
  status: GameStatus;
  game: GameSession | null;
}

export interface GameSession {
  startSlug: string;
  targetSlug: string;
  startTime: number;
  endTime: number | null;
  timeLimitSeconds: number | null;
  winnerSocketId: string | null;
  timerHandle: ReturnType<typeof setTimeout> | null;
}
