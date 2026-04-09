import { NavigationStep } from './wikipedia.types';

export interface PlayerSummary {
  pseudo: string;
  isWinner: boolean;
  surrendered: boolean;
  hopCount: number;
  path: NavigationStep[];
}

export interface GameSummary {
  roomCode: string;
  startSlug: string;
  targetSlug: string;
  startTime: number;
  endTime: number;
  timeLimitSeconds: number | null;
  winnerPseudo: string | null;
  players: PlayerSummary[];
}
