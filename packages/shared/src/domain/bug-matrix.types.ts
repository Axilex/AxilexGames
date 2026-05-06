import { PlayerStatus } from './enums';

export type BugMatrixPhase =
  | 'WAITING'
  | 'BRIEF'
  | 'DISCUSSION'
  | 'VOTE'
  | 'REVEAL'
  | 'FINISHED';

export type BugMatrixStatus = 'WAITING' | 'IN_GAME' | 'FINISHED';

export type BugMatrixRole = 'NORMAL' | 'GLITCHED';

export type BugMatrixRuleCategory = 'FORM' | 'TONE' | 'CONTENT';

export type BugMatrixRuleDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/** Label a voter assigns to a target during VOTE: NORMAL accuses them of being the Normal,
 *  the three categories guess which kind of glitched rule they have. */
export type BugMatrixVoteLabel = 'NORMAL' | 'FORM' | 'TONE' | 'CONTENT';

export interface BugMatrixRule {
  id: string;
  label: string;
  category: BugMatrixRuleCategory;
  difficulty: BugMatrixRuleDifficulty;
}

export interface BugMatrixTheme {
  id: string;
  label: string;
}

export interface BugMatrixSettings {
  roundCount: number;
  discussionMs: number;
  questionRotationMs: number;
  voteMs: number;
  targetScore: number;
}

export interface BugMatrixPlayer {
  socketId: string;
  pseudo: string;
  score: number;
  isHost: boolean;
  status: PlayerStatus;
  /** Present only in REVEAL/FINISHED for everyone, or in any phase via unicast `secret-role` for self. */
  role?: BugMatrixRole;
  /** Glitched player only. */
  ruleLabel?: string;
  /** Glitched player only. */
  ruleCategory?: BugMatrixRuleCategory;
}

export interface BugMatrixQuestion {
  id: string;
  text: string;
}

/** Full vote map: voterPseudo → (targetPseudo → label). */
export type BugMatrixVoteMap = Record<string, Record<string, BugMatrixVoteLabel>>;

export interface BugMatrixRoundResult {
  round: number;
  normalPseudo: string;
  votes: BugMatrixVoteMap;
  rules: { pseudo: string; ruleLabel: string; category: BugMatrixRuleCategory }[];
  scoreDeltas: Record<string, number>;
}

export interface BugMatrixRoom {
  code: string;
  status: BugMatrixStatus;
  phase: BugMatrixPhase;
  round: number;
  themeLabel: string | null;
  players: BugMatrixPlayer[];
  settings: BugMatrixSettings;
  hostPseudo: string;
  currentQuestion: BugMatrixQuestion | null;
  /** Server timestamp (ms) when the global discussion timer expires. */
  discussionTimerEndsAt: number | null;
  /** Server timestamp (ms) when the vote timer expires. */
  voteTimerEndsAt: number | null;
  /** Last round's full result; populated in REVEAL and persisted until next round starts. */
  lastResult: BugMatrixRoundResult | null;
}

/**
 * Wire-safe DTO. Stripping is applied server-side via `toDTO`:
 *  - `players[].role`/`ruleLabel`/`ruleCategory` are absent outside REVEAL/FINISHED,
 *  - `lastResult` is absent outside REVEAL/FINISHED.
 *  Schema-wise the DTO is identical to the room (fields just become undefined when stripped).
 */
export type BugMatrixRoomDTO = BugMatrixRoom;

export interface BugMatrixRankEntry {
  pseudo: string;
  score: number;
  rank: number;
}
