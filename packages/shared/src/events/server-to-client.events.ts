import { RoomDTO } from '../dto/room.dto';
import { GameStateDTO } from '../dto/game-state.dto';
import { PlayerProgressDTO } from '../dto/player-progress.dto';
import { GameSummary } from '../domain/game-summary.types';
import { WikipediaPage } from '../domain/wikipedia.types';
import { BingoConstraintId } from '../domain/bingo.types';

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
  error: (message: string) => void;
}
