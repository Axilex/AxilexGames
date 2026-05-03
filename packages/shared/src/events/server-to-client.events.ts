import { RoomDTO } from '../dto/room.dto';
import { GameStateDTO } from '../dto/game-state.dto';
import { PlayerProgressDTO } from '../dto/player-progress.dto';
import { GameSummary } from '../domain/game-summary.types';
import { WikipediaPage } from '../domain/wikipedia.types';
import { BingoConstraintId } from '../domain/bingo.types';
import { ChoosingPreviewPayload } from './client-to-server.events';
import {
  SurenchereRoomDTO,
  SurenchereRoundResult,
  SurencherePlayer,
} from '../domain/surenchere.types';
import { CommonRoomDTO, GameChoice } from '../domain/common-lobby.types';
import { SnapAvisRoomDTO, SnapAvisRoundResult, SnapAvisRankEntry } from '../domain/snap-avis.types';
import {
  TelepathieRoomDTO,
  TelepathieSousRoundResult,
  TelepathieMancheResult,
  TelepathieRankEntry,
} from '../domain/telepathie.types';

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
  'lobby:room-update': (room: CommonRoomDTO) => void;
  'lobby:error': (payload: { code: string; message: string }) => void;
  'lobby:redirect': (payload: { game: GameChoice; code: string }) => void;
  'wikirace:room:update': (room: RoomDTO) => void;
  'wikirace:game:state': (state: GameStateDTO) => void;
  'wikirace:game:page': (page: WikipediaPage) => void;
  'wikirace:player:progress': (progress: PlayerProgressDTO) => void;
  'wikirace:game:finished': (summary: GameSummary) => void;
  'wikirace:navigation:error': (error: NavigationErrorPayload) => void;
  'wikirace:player:disconnected': (pseudo: string) => void;
  'wikirace:player:reconnected': (pseudo: string) => void;
  'wikirace:bingo:validated': (payload: BingoValidatedPayload) => void;
  'wikirace:choosing:preview': (data: ChoosingPreviewData) => void;
  'surenchere:room:update': (room: SurenchereRoomDTO) => void;
  'surenchere:round:start': (payload: { round: number; firstBidderSocketId: string }) => void;
  'surenchere:bid:update': (payload: { bidderSocketId: string; amount: number }) => void;
  'surenchere:pass:update': (payload: { socketId: string }) => void;
  'surenchere:round:end': (payload: {
    result: SurenchereRoundResult;
    scores: Record<string, number>;
  }) => void;
  'surenchere:game:finished': (payload: {
    scores: Record<string, number>;
    ranked: SurencherePlayer[];
  }) => void;
  'surenchere:timer-update': (payload: {
    phase: 'CHOOSING' | 'BIDDING' | 'WORDS';
    endsAt: number;
  }) => void;
  'surenchere:vote-update': (payload: { votes: Record<string, boolean | null> }) => void;
  'surenchere:typing-update': (payload: { pseudo: string; text: string }) => void;
  'surenchere:error': (payload: { code: string; message: string }) => void;
  'snapavis:room-update': (room: SnapAvisRoomDTO) => void;
  'snapavis:round-start': (payload: { round: number; total: number; imageUrl: string }) => void;
  'snapavis:writing-start': (payload: { endsAt: number }) => void;
  'snapavis:word-received': (payload: { pseudo: string }) => void;
  'snapavis:results': (result: SnapAvisRoundResult) => void;
  'snapavis:game-finished': (payload: { rankings: SnapAvisRankEntry[] }) => void;
  'snapavis:error': (payload: { code: string; message: string }) => void;
  'telepathie:room-update': (room: TelepathieRoomDTO) => void;
  'telepathie:choose-open': (payload: { endsAt: number }) => void;
  'telepathie:input-open': (payload: { endsAt: number }) => void;
  'telepathie:word-received': (payload: { pseudo: string }) => void;
  'telepathie:round-result': (result: TelepathieSousRoundResult) => void;
  'telepathie:manche-result': (result: TelepathieMancheResult) => void;
  'telepathie:game-finished': (payload: { rankings: TelepathieRankEntry[] }) => void;
  'telepathie:error': (payload: { code: string; message: string }) => void;
  /**
   * Generic error channel — currently only emitted by `WsExceptionFilter` on the
   * wikirace gateway. Same shape as the per-game `*:error` events for consistency.
   */
  error: (payload: { code: string; message: string }) => void;
}
