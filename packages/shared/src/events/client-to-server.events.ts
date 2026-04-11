import { GameMode, DriftObjective } from '../domain/enums';
import { BingoConstraintId } from '../domain/bingo.types';

export interface RoomCreatePayload {
  pseudo: string;
}

export interface RoomJoinPayload {
  roomCode: string;
  pseudo: string;
}

export interface GameStartPayload {
  roomCode: string;
}

export interface GameConfirmChoicesPayload {
  roomCode: string;
  mode?: GameMode;
  timeLimitSeconds: number | null;
  clickLimit?: number | null;
  startSlug?: string;
  targetSlug?: string;
  driftObjective?: DriftObjective;
  bingoConstraintIds?: BingoConstraintId[];
}

export interface GameNavigatePayload {
  roomCode: string;
  targetSlug: string;
}

export interface GameSurrenderPayload {
  roomCode: string;
}

export interface ChoosingPreviewPayload {
  roomCode: string;
  mode: GameMode;
  startTitle?: string;
  targetTitle?: string;
  timeLimitSeconds?: number | null;
  clickLimit?: number | null;
  driftObjective?: DriftObjective | null;
  bingoConstraintIds?: BingoConstraintId[];
}

export interface SurenchereCreatePayload {
  pseudo: string;
  settings?: Partial<{ totalRounds: number; startBid: number }>;
}

export interface SurenchereJoinPayload {
  roomCode: string;
  pseudo: string;
}

export interface SurenchereBidPayload {
  amount: number;
}

export interface SurenchereVerdictPayload {
  success: boolean;
}

export interface SurenchereChooseChallengePayload {
  challengeId: string;
}

export interface SurenchereSubmitWordsPayload {
  words: string[];
}

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload) => void;
  'room:join': (payload: RoomJoinPayload) => void;
  'room:leave': (payload: { roomCode: string }) => void;
  'room:reset': (payload: { roomCode: string }) => void;
  'game:start': (payload: GameStartPayload) => void;
  'game:confirm_choices': (payload: GameConfirmChoicesPayload) => void;
  'game:navigate': (payload: GameNavigatePayload) => void;
  'game:surrender': (payload: GameSurrenderPayload) => void;
  'choosing:preview': (payload: ChoosingPreviewPayload) => void;
  'surenchere:create': (payload: SurenchereCreatePayload) => void;
  'surenchere:join': (payload: SurenchereJoinPayload) => void;
  'surenchere:leave': () => void;
  'surenchere:start': () => void;
  'surenchere:bid': (payload: SurenchereBidPayload) => void;
  'surenchere:pass': () => void;
  'surenchere:challenge': () => void;
  'surenchere:verdict': (payload: SurenchereVerdictPayload) => void;
  'surenchere:choose_challenge': (payload: SurenchereChooseChallengePayload) => void;
  'surenchere:submit_words': (payload: SurenchereSubmitWordsPayload) => void;
  'surenchere:reset': () => void;
}
