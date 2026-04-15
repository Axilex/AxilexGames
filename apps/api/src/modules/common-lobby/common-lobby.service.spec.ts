import { Test, TestingModule } from '@nestjs/testing';
import { CommonLobbyService } from './common-lobby.service';
import { CommonLobbyRegistryService } from './common-lobby-registry.service';

describe('CommonLobbyService', () => {
  let service: CommonLobbyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonLobbyService, CommonLobbyRegistryService],
    }).compile();
    service = module.get(CommonLobbyService);
  });

  describe('createRoom', () => {
    it('creates a room with host', () => {
      const room = service.createRoom('Alice', 's1');
      expect(room.code).toHaveLength(6);
      expect(room.players.size).toBe(1);
      expect(room.hostSocketId).toBe('s1');
      const host = room.players.get('s1');
      expect(host?.pseudo).toBe('Alice');
      expect(host?.isHost).toBe(true);
    });

    it('sets status WAITING and no game choice', () => {
      const room = service.createRoom('Bob', 's1');
      expect(room.status).toBe('WAITING');
      expect(room.gameChoice).toBeNull();
    });
  });

  describe('joinRoom', () => {
    it('joins a new player', () => {
      const room = service.createRoom('Alice', 's1');
      const joined = service.joinRoom(room.code, 'Bob', 's2');
      expect(joined.players.size).toBe(2);
      expect(joined.players.get('s2')?.pseudo).toBe('Bob');
    });

    it('throws ROOM_NOT_FOUND for unknown code', () => {
      expect(() => service.joinRoom('ZZZZZZ', 'Bob', 's2')).toThrow('ROOM_NOT_FOUND');
    });

    it('throws PSEUDO_TAKEN when pseudo already exists and CONNECTED', () => {
      const room = service.createRoom('Alice', 's1');
      expect(() => service.joinRoom(room.code, 'Alice', 's2')).toThrow('PSEUDO_TAKEN');
    });

    it('throws GAME_IN_PROGRESS when status is IN_GAME', () => {
      const room = service.createRoom('Alice', 's1');
      service.joinRoom(room.code, 'Bob', 's2');
      // Manually set status to IN_GAME for the test
      room.status = 'IN_GAME';
      expect(() => service.joinRoom(room.code, 'Carol', 's3')).toThrow('GAME_IN_PROGRESS');
    });

    it('reconnects a disconnected player', () => {
      const room = service.createRoom('Alice', 's1');
      service.markDisconnected('s1');
      const rejoined = service.joinRoom(room.code, 'Alice', 's1-new');
      expect(rejoined.players.get('s1-new')?.pseudo).toBe('Alice');
      expect(rejoined.players.get('s1-new')?.status).toBe('CONNECTED');
    });
  });

  describe('leaveRoom', () => {
    it('removes player and keeps room alive', () => {
      const room = service.createRoom('Alice', 's1');
      service.joinRoom(room.code, 'Bob', 's2');
      const { room: updated, deleted } = service.leaveRoom('s2');
      expect(deleted).toBe(false);
      expect(updated?.players.size).toBe(1);
    });

    it('deletes room when last player leaves', () => {
      service.createRoom('Alice', 's1');
      const { deleted } = service.leaveRoom('s1');
      expect(deleted).toBe(true);
    });

    it('transfers host when host leaves', () => {
      const room = service.createRoom('Alice', 's1');
      service.joinRoom(room.code, 'Bob', 's2');
      service.leaveRoom('s1');
      expect(room.hostSocketId).toBe('s2');
      expect(room.players.get('s2')?.isHost).toBe(true);
    });
  });

  describe('chooseGame', () => {
    it('sets game choice for host', () => {
      service.createRoom('Alice', 's1');
      const updated = service.chooseGame('s1', 'surenchere');
      expect(updated.gameChoice).toBe('surenchere');
    });

    it('throws NOT_HOST for non-host', () => {
      const room = service.createRoom('Alice', 's1');
      service.joinRoom(room.code, 'Bob', 's2');
      expect(() => service.chooseGame('s2', 'wikirace')).toThrow('NOT_HOST');
    });
  });

  describe('startRoom', () => {
    it('starts room with 2+ connected players and game chosen', () => {
      const room = service.createRoom('Alice', 's1');
      service.joinRoom(room.code, 'Bob', 's2');
      service.chooseGame('s1', 'surenchere');
      const started = service.startRoom('s1');
      expect(started.status).toBe('IN_GAME');
    });

    it('throws NOT_ENOUGH_PLAYERS with only 1 player', () => {
      service.createRoom('Alice', 's1');
      service.chooseGame('s1', 'wikirace');
      expect(() => service.startRoom('s1')).toThrow('NOT_ENOUGH_PLAYERS');
    });

    it('throws NO_GAME_CHOSEN when no game selected', () => {
      const room = service.createRoom('Alice', 's1');
      service.joinRoom(room.code, 'Bob', 's2');
      expect(() => service.startRoom('s1')).toThrow('NO_GAME_CHOSEN');
    });

    it('throws NOT_HOST for non-host', () => {
      const room = service.createRoom('Alice', 's1');
      service.joinRoom(room.code, 'Bob', 's2');
      service.chooseGame('s1', 'wikirace');
      expect(() => service.startRoom('s2')).toThrow('NOT_HOST');
    });
  });
});
