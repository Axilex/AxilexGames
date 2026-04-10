import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RoomDTO, ChoosingPreviewData } from '@wiki-race/shared';

export const useLobbyStore = defineStore('lobby', () => {
  const room = ref<RoomDTO | null>(null);
  const error = ref<string | null>(null);
  const choosingPreview = ref<ChoosingPreviewData | null>(null);

  function setRoom(newRoom: RoomDTO): void {
    room.value = newRoom;
    error.value = null;
    if (newRoom.status !== 'CHOOSING') choosingPreview.value = null;
  }

  function setChoosingPreview(data: ChoosingPreviewData): void {
    choosingPreview.value = data;
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
    choosingPreview.value = null;
  }

  return { room, error, choosingPreview, setRoom, setChoosingPreview, setError, clearError, reset };
});
