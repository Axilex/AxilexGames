import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLobbyStore } from './useLobbyStore';
import { GameStatus, PlayerStatus } from '@wiki-race/shared';
import type { RoomDTO } from '@wiki-race/shared';

const mockRoom: RoomDTO = {
  code: 'ABCDEF',
  status: GameStatus.WAITING,
  players: [{ pseudo: 'Alice', status: PlayerStatus.CONNECTED, isHost: true }],
  hostPseudo: 'Alice',
  chooserPseudo: null,
};

describe('useLobbyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with null room', () => {
    const store = useLobbyStore();
    expect(store.room).toBeNull();
    expect(store.error).toBeNull();
  });

  it('setRoom updates room and clears error', () => {
    const store = useLobbyStore();
    store.setError('previous error');
    store.setRoom(mockRoom);
    expect(store.room?.code).toBe('ABCDEF');
    expect(store.error).toBeNull();
  });

  it('setError stores error message', () => {
    const store = useLobbyStore();
    store.setError('PSEUDO_TAKEN');
    expect(store.error).toBe('PSEUDO_TAKEN');
  });

  it('clearError removes error', () => {
    const store = useLobbyStore();
    store.setError('ROOM_NOT_FOUND');
    store.clearError();
    expect(store.error).toBeNull();
  });

  it('reset clears both room and error', () => {
    const store = useLobbyStore();
    store.setRoom(mockRoom);
    store.setError('some error');
    store.reset();
    expect(store.room).toBeNull();
    expect(store.error).toBeNull();
  });
});
