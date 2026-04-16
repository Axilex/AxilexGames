import { PlayerStatus } from './enums';

export type SnapAvisPhase =
  | 'WAITING'
  | 'REVEALING'
  | 'WRITING'
  | 'RESULTS'
  | 'ROUND_END'
  | 'FINISHED';

export interface SnapAvisPlayer {
  socketId: string;
  pseudo: string;
  score: number;
  status: PlayerStatus;
  isHost: boolean;
  hasSubmitted: boolean;
}

export interface SnapAvisSettings {
  totalRounds: number;
  revealDurationMs: number;
  writingDurationMs: number;
}

export interface SnapAvisImage {
  id: string;
  url: string;
  category: string;
}

export interface SnapAvisRoundResult {
  imageUrl: string;
  /** pseudo → mot soumis (normalisé) */
  words: Record<string, string>;
  /** mot normalisé → liste de pseudos */
  groups: Record<string, string[]>;
  /** pseudo → points gagnés ce round */
  scores: Record<string, number>;
}

export interface SnapAvisRankEntry {
  pseudo: string;
  score: number;
  rank: number;
}

export interface SnapAvisRoom {
  code: string;
  hostSocketId: string;
  players: SnapAvisPlayer[];
  phase: SnapAvisPhase;
  settings: SnapAvisSettings;
  currentRound: number;
  currentImage: SnapAvisImage | null;
  roundResults: SnapAvisRoundResult | null;
  writingTimerEndsAt: number | null;
}

export type SnapAvisRoomDTO = SnapAvisRoom;
