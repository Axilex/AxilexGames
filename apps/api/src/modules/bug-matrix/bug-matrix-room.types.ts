import type {
  BugMatrixPlayer,
  BugMatrixQuestion,
  BugMatrixRoom,
  BugMatrixVoteMap,
} from '@wiki-race/shared';

/**
 * Server-only player type — adds `sessionToken`, `roleSecret` and `ruleId`.
 * `role`/`ruleLabel`/`ruleCategory` exist on the shared `BugMatrixPlayer` but
 * are stripped from broadcasts outside REVEAL/FINISHED via `toDTO`. The
 * raw rule id stays server-side (only the human label is ever sent).
 */
export interface BugMatrixPlayerInternal extends BugMatrixPlayer {
  sessionToken: string | null;
  ruleId?: string;
}

/** Server-internal room — keeps voteMap, question pool, cursor, and timer endpoints. */
export interface BugMatrixRoomInternal extends Omit<BugMatrixRoom, 'players'> {
  players: BugMatrixPlayerInternal[];
  voteMap: BugMatrixVoteMap;
  questionPool: BugMatrixQuestion[];
  currentQuestionIndex: number;
}
