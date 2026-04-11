import { RoomDTO } from '../dto/room.dto';
import { GameStateDTO } from '../dto/game-state.dto';
import { PlayerProgressDTO } from '../dto/player-progress.dto';
import { GameSummary } from '../domain/game-summary.types';
import { WikipediaPage } from '../domain/wikipedia.types';
import { BingoConstraintId } from '../domain/bingo.types';
import { ChoosingPreviewPayload } from './client-to-server.events';
import {
  SurenchereRoomDTO,
  SurenchereChallenge,
  SurenchereRoundResult,
  SurencherePlayer,
} from '../domain/surenchere.types';

export type ChoosingPreviewData = Omit<ChoosingPreviewPayload, 'roomCode'>;

export interface NavigationErrorPayload {
  message: string;
  targetSlug: string;
}

export interface BingoValidatedPayload {
  constraintIds: BingoConstraintId[];
  slug: string;
}

export interface ServerToClientEvents {
  'room:update': (room: RoomDTO) => void;
  'game:state': (state: GameStateDTO) => void;
  'game:page': (page: WikipediaPage) => void;
  'player:progress': (progress: PlayerProgressDTO) => void;
  'game:finished': (summary: GameSummary) => void;
  'navigation:error': (error: NavigationErrorPayload) => void;
  'player:disconnected': (pseudo: string) => void;
  'player:reconnected': (pseudo: string) => void;
  'bingo:validated': (payload: BingoValidatedPayload) => void;
  'choosing:preview': (data: ChoosingPreviewData) => void;
  'surenchere:room:update': (room: SurenchereRoomDTO) => void;
  'surenchere:round:start': (payload: {
    round: number;
    firstBidderSocketId: string;
  }) => void;
  'surenchere:bid:update': (payload: { bidderSocketId: string; amount: number }) => void;
  'surenchere:pass:update': (payload: { socketId: string }) => void;
  'surenchere:verdict:start': (payload: {
    bidderSocketId: string;
    bid: number;
    challenge: SurenchereChallenge;
  }) => void;
  'surenchere:round:end': (payload: {
    result: SurenchereRoundResult;
    scores: Record<string, number>;
  }) => void;
  'surenchere:game:finished': (payload: {
    scores: Record<string, number>;
    ranked: SurencherePlayer[];
  }) => void;
  'surenchere:error': (payload: { code: string; message: string }) => void;
  error: (message: string) => void;
}
