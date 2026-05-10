import type { BugMatrixRuleCategory, BugMatrixVoteLabel } from '@wiki-race/shared';

export const VOTE_LABELS_FR: Record<BugMatrixVoteLabel, string> = {
  NORMAL: 'Normal',
  FORM: 'Forme',
  TONE: 'Ton',
  CONTENT: 'Contenu',
};

export function ruleCategoryFr(category: BugMatrixRuleCategory): string {
  return VOTE_LABELS_FR[category];
}
