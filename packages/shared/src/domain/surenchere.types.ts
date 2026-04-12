import { PlayerStatus } from './enums';

export type SurenchereGamePhase =
  | 'WAITING'
  | 'CHOOSING_CHALLENGE'
  | 'BIDDING'
  | 'WORDS'
  | 'VOTING'
  | 'ROUND_END'
  | 'FINISHED';

export interface WordVotes {
  valid: string[]; // socketIds who voted valid
  invalid: string[]; // socketIds who voted invalid
}

export interface SurencherePlayer {
  socketId: string;
  pseudo: string;
  score: number;
  isHost: boolean;
  status: PlayerStatus;
}

export type ChallengeSource = 'predefined' | 'custom';

export interface SurenchereChallenge {
  id: string;
  category: string;
  prompt: string;
  letter: string;
  source: ChallengeSource;
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
  wordVotes: Record<number, WordVotes>;
  roundStarterIndex: number;
  lastRoundResult: SurenchereRoundResult | null;
}

export interface SurenchereRoundResult {
  bidderSocketId: string;
  bidderPseudo: string;
  challenge: SurenchereChallenge;
  bid: number;
  success: boolean;
  pointsDelta: number; // = number of valid words (always >= 0)
  words: string[];
  wordVerdicts: boolean[]; // per-word: true if accepted by majority vote
  wasForced: boolean;
}

export type SurenchereRoomDTO = SurenchereRoom;
