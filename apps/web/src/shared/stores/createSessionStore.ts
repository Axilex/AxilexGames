import { defineStore } from 'pinia';
import { ref } from 'vue';

interface SessionData {
  pseudo: string;
  roomCode: string;
}

/**
 * Factory producing a Pinia store that persists `{ pseudo, roomCode }` to `sessionStorage`.
 * Each mini-game calls this with its own `id` and `storageKey`.
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

    function setSession(newPseudo: string, newRoomCode: string): void {
      pseudo.value = newPseudo;
      roomCode.value = newRoomCode;
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ pseudo: newPseudo, roomCode: newRoomCode }),
      );
    }

    function setSocketId(id: string): void {
      socketId.value = id;
    }

    function clearSession(): void {
      pseudo.value = '';
      roomCode.value = '';
      socketId.value = '';
      sessionStorage.removeItem(storageKey);
    }

    return { pseudo, roomCode, socketId, setSession, setSocketId, clearSession };
  });
}
