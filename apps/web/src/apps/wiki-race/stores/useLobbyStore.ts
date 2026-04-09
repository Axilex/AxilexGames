import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RoomDTO } from '@wiki-race/shared';

export const useLobbyStore = defineStore('lobby', () => {
  const room = ref<RoomDTO | null>(null);
  const error = ref<string | null>(null);

  function setRoom(newRoom: RoomDTO): void {
    room.value = newRoom;
    error.value = null;
  }

  function setError(message: string): void {
    error.value = message;
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    room.value = null;
    error.value = null;
  }

  return { room, error, setRoom, setError, clearError, reset };
});
