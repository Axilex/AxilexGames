import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSessionStore } from './useSessionStore';

// Mock sessionStorage
const storageMock: Record<string, string> = {};
vi.stubGlobal('sessionStorage', {
  getItem: (key: string) => storageMock[key] ?? null,
  setItem: (key: string, value: string) => {
    storageMock[key] = value;
  },
  removeItem: (key: string) => {
    delete storageMock[key];
  },
});

describe('useSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    Object.keys(storageMock).forEach((k) => delete storageMock[k]);
  });

  it('initializes with empty values', () => {
    const store = useSessionStore();
    expect(store.pseudo).toBe('');
    expect(store.roomCode).toBe('');
    expect(store.socketId).toBe('');
  });

  it('setSession updates pseudo and roomCode and persists to sessionStorage', () => {
    const store = useSessionStore();
    store.setSession('Alice', 'ABC123');
    expect(store.pseudo).toBe('Alice');
    expect(store.roomCode).toBe('ABC123');
    expect(storageMock['wiki-race-session']).toContain('Alice');
  });

  it('setSocketId updates socketId', () => {
    const store = useSessionStore();
    store.setSocketId('socket-xyz');
    expect(store.socketId).toBe('socket-xyz');
  });

  it('clearSession resets all values and removes from sessionStorage', () => {
    const store = useSessionStore();
    store.setSession('Alice', 'ABC123');
    store.clearSession();
    expect(store.pseudo).toBe('');
    expect(store.roomCode).toBe('');
    expect(storageMock['wiki-race-session']).toBeUndefined();
  });
});
