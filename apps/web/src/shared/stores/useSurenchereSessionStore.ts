import { createSessionStore } from './createSessionStore';

export const useSurenchereSessionStore = createSessionStore(
  'surenchere-session',
  'axilex-surenchere-session',
);
