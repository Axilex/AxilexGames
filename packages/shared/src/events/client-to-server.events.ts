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

export interface ClientToServerEvents {
  'room:create': (payload: RoomCreatePayload) => void;
  'room:join': (payload: RoomJoinPayload) => void;
  'room:leave': (payload: { roomCode: string }) => void;
  'room:reset': (payload: { roomCode: string }) => void;
  'game:start': (payload: GameStartPayload) => void;
  'game:confirm_choices': (payload: GameConfirmChoicesPayload) => void;
  'game:navigate': (payload: GameNavigatePayload) => void;
  'game:surrender': (payload: GameSurrenderPayload) => void;
}
