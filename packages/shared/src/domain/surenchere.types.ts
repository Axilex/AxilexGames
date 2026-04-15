import { PlayerStatus } from './enums';

export type SurenchereGamePhase =
  | 'WAITING'
  | 'CHOOSING_CHALLENGE'
  | 'BIDDING'
  | 'WORDS'
  | 'VOTING'
  | 'ROUND_END'
  | 'FINISHED';

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
  source: ChallengeSource;
}

export interface SurenchereRoomSettings {
  totalRounds: number;
  startBid: number;
  /** Timer for the words submission phase, in seconds. Default: 60. */
  wordTimerSeconds: number;
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
  /** Block-vote map: socketId → accept. Replaces per-word wordVotes. */
  voteMap: Record<string, boolean>;
  roundStarterIndex: number;
  lastRoundResult: SurenchereRoundResult | null;
  /** Server timestamp (ms) when the bid timer expires. Null when not in BIDDING. */
  bidTimerEndsAt: number | null;
  /** Server timestamp (ms) when the words timer expires. Null when not in WORDS. */
  wordsTimerEndsAt: number | null;
}

export interface SurenchereRoundResult {
  bidderSocketId: string;
  bidderPseudo: string;
  challenge: SurenchereChallenge;
  bid: number;
  success: boolean;
  /** Score delta applied to the bidder this round. */
  scoreDelta: number;
  /** Number of missing words (bid - validatedWords). With block vote: always 0 or bid. */
  missingCount: number;
  words: string[];
  /** With block vote: all true or all false (binary verdict). */
  wordVerdicts: boolean[];
  wasForced: boolean;
}

export type SurenchereRoomDTO = SurenchereRoom;
