import { defineStore } from 'pinia';
import { ref } from 'vue';

interface SessionData {
  pseudo: string;
  roomCode: string;
  /** Server-issued secret — required to claim the slot back on reconnect. */
  sessionToken?: string;
}

/**
 * Factory producing a Pinia store that persists `{ pseudo, roomCode, sessionToken }`
 * to `sessionStorage`. Each mini-game calls this with its own `id` and `storageKey`.
 */
export function createSessionStore(id: string, storageKey: string) {
  function load(): SessionData | null {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as SessionData) : null;
    } catch {
      return null;
    }
  }

  return defineStore(id, () => {
    const saved = load();

    const pseudo = ref<string>(saved?.pseudo ?? '');
    const roomCode = ref<string>(saved?.roomCode ?? '');
    const socketId = ref<string>('');
    const sessionToken = ref<string>(saved?.sessionToken ?? '');

    function persist(): void {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          pseudo: pseudo.value,
          roomCode: roomCode.value,
          sessionToken: sessionToken.value,
        }),
      );
    }

    function setSession(newPseudo: string, newRoomCode: string): void {
      pseudo.value = newPseudo;
      roomCode.value = newRoomCode;
      persist();
    }

    function setSocketId(id: string): void {
      socketId.value = id;
    }

    function setSessionToken(token: string): void {
      sessionToken.value = token;
      persist();
    }

    function clearSession(): void {
      pseudo.value = '';
      roomCode.value = '';
      socketId.value = '';
      sessionToken.value = '';
      sessionStorage.removeItem(storageKey);
    }

    return {
      pseudo,
      roomCode,
      socketId,
      sessionToken,
      setSession,
      setSocketId,
      setSessionToken,
      clearSession,
    };
  });
}
