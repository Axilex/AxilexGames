import { PlayerStatus } from './enums';

export type SurenchereGamePhase =
  | 'WAITING'
  | 'CHOOSING_CHALLENGE'
  | 'BIDDING'
  | 'WORDS'
  | 'VERDICT'
  | 'ROUND_END'
  | 'FINISHED';

export interface SurencherePlayer {
  socketId: string;
  pseudo: string;
  score: number;
  isHost: boolean;
  status: PlayerStatus;
}

export interface SurenchereChallenge {
  id: string;
  category: string;
  prompt: string;
  letter: string;
}

export interface SurenchereRoomSettings {
  totalRounds: number;
  startBid: number;
}

export interface SurenchereRoom {
  code: string;
  phase: SurenchereGamePhase;
  players: SurencherePlayer[];
  settings: SurenchereRoomSettings;
  currentRound: number;
  currentChallenge: SurenchereChallenge | null;
  challengeOptions: SurenchereChallenge[];
  challengeChooserSocketId: string | null;
  currentBid: number;
  currentBidderSocketId: string | null;
  passedSocketIds: string[];
  currentWords: string[] | null;
  wasForced: boolean;
  roundStarterIndex: number;
  lastRoundResult: SurenchereRoundResult | null;
}

export interface SurenchereRoundResult {
  bidderSocketId: string;
  bidderPseudo: string;
  challenge: SurenchereChallenge;
  bid: number;
  success: boolean;
  pointsDelta: number;
  words: string[];
  forcedBonus: number;
}

export type SurenchereRoomDTO = SurenchereRoom;
