import { createSessionStore } from './createSessionStore';

export const useBugMatrixSessionStore = createSessionStore(
  'bug-matrix-session',
  'axilex-bug-matrix-session',
);
