import { createSessionStore } from './createSessionStore';

export const useTelepathieSessionStore = createSessionStore(
  'telepathie-session',
  'axilex-telepathie-session',
);
