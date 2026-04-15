import { GameMode } from '../domain/enums';
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
  bingoConstraintIds?: BingoConstraintId[];
}

export interface LobbyCreatePayload {
  pseudo: string;
}

export interface LobbyJoinPayload {
  roomCode: string;
  pseudo: string;
}

export interface LobbyChooseGamePayload {
  game: 'wikirace' | 'surenchere';
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

export interface SurenchereVotePayload {
  accept: boolean;
}

export interface SurenchereTypingPayload {
  text: string;
}

export interface SurenchereChooseChallengePayload {
  challengeId?: string;
  customPhrase?: string;
}

export interface SurenchereSubmitWordsPayload {
  words: string[];
}

export interface ClientToServerEvents {
  'lobby:create': (payload: LobbyCreatePayload) => void;
  'lobby:join': (payload: LobbyJoinPayload) => void;
  'lobby:leave': () => void;
  'lobby:choose-game': (payload: LobbyChooseGamePayload) => void;
  'lobby:start': () => void;
  'wikirace:room:create': (payload: RoomCreatePayload) => void;
  'wikirace:room:join': (payload: RoomJoinPayload) => void;
  'wikirace:room:leave': (payload: { roomCode: string }) => void;
  'wikirace:room:reset': (payload: { roomCode: string }) => void;
  'wikirace:game:start': (payload: GameStartPayload) => void;
  'wikirace:game:confirm_choices': (payload: GameConfirmChoicesPayload) => void;
  'wikirace:game:navigate': (payload: GameNavigatePayload) => void;
  'wikirace:game:surrender': (payload: GameSurrenderPayload) => void;
  'wikirace:choosing:preview': (payload: ChoosingPreviewPayload) => void;
  'surenchere:create': (payload: SurenchereCreatePayload) => void;
  'surenchere:join': (payload: SurenchereJoinPayload) => void;
  'surenchere:leave': () => void;
  'surenchere:start': () => void;
  'surenchere:bid': (payload: SurenchereBidPayload) => void;
  'surenchere:pass': () => void;
  'surenchere:challenge': () => void;
  'surenchere:vote': (payload: SurenchereVotePayload) => void;
  'surenchere:typing': (payload: SurenchereTypingPayload) => void;
  'surenchere:choose_challenge': (payload: SurenchereChooseChallengePayload) => void;
  'surenchere:submit_words': (payload: SurenchereSubmitWordsPayload) => void;
  'surenchere:reset': () => void;
}
