import { defineStore } from 'pinia';
import { ref } from 'vue';

const SESSION_KEY = 'axilex-surenchere-session';

interface SessionData {
  pseudo: string;
  roomCode: string;
}

function loadSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionData) : null;
  } catch {
    return null;
  }
}

export const useSurenchereSessionStore = defineStore('surenchere-session', () => {
  const saved = loadSession();

  const pseudo = ref<string>(saved?.pseudo ?? '');
  const roomCode = ref<string>(saved?.roomCode ?? '');

  function setSession(newPseudo: string, newRoomCode: string): void {
    pseudo.value = newPseudo;
    roomCode.value = newRoomCode;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ pseudo: newPseudo, roomCode: newRoomCode }),
    );
  }

  function clearSession(): void {
    pseudo.value = '';
    roomCode.value = '';
    sessionStorage.removeItem(SESSION_KEY);
  }

  return { pseudo, roomCode, setSession, clearSession };
});
