import { Test, TestingModule } from '@nestjs/testing';
import { LobbyService } from './lobby.service';
import { RoomRegistryService } from './room-registry.service';
import { GameStatus, PlayerStatus } from '@wiki-race/shared';

async function setup() {
  const module: TestingModule = await Test.createTestingModule({
    providers: [LobbyService, RoomRegistryService],
  }).compile();
  return {
    service: module.get<LobbyService>(LobbyService),
  };
}

describe('LobbyService', () => {
  it('creates a room with a 6-char code and the host as only player', async () => {
    const { service } = await setup();
    const { room, code } = service.createRoom('Alice', 'socket1');
    expect(code).toHaveLength(6);
    expect(room.hostSocketId).toBe('socket1');
    expect(room.players.size).toBe(1);
    expect(room.players.get('socket1')!.pseudo).toBe('Alice');
    expect(room.status).toBe(GameStatus.WAITING);
  });

  it('allows a second player to join', async () => {
    const { service } = await setup();
    const { room, code } = service.createRoom('Alice', 'socket1');
    service.joinRoom(code, 'Bob', 'socket2');
    expect(room.players.size).toBe(2);
  });

  it('rejects a duplicate pseudo', async () => {
    const { service } = await setup();
    const { code } = service.createRoom('Alice', 'socket1');
    expect(() => service.joinRoom(code, 'Alice', 'socket2')).toThrow('PSEUDO_TAKEN');
  });

  it('rejects join when room not found', async () => {
    const { service } = await setup();
    expect(() => service.joinRoom('XXXXXX', 'Bob', 'socket2')).toThrow('ROOM_NOT_FOUND');
  });

  it('rejects join when max players reached', async () => {
    const { service } = await setup();
    const { code } = service.createRoom('P0', 'socket0');
    for (let i = 1; i <= 7; i++) {
      service.joinRoom(code, `P${i}`, `socket${i}`);
    }
    expect(() => service.joinRoom(code, 'P8', 'socket8')).toThrow('ROOM_FULL');
  });

  it('rejects join when game is in progress', async () => {
    const { service } = await setup();
    const { room, code } = service.createRoom('Alice', 'socket1');
    room.status = GameStatus.IN_PROGRESS;
    expect(() => service.joinRoom(code, 'Bob', 'socket2')).toThrow('GAME_IN_PROGRESS');
  });

  it('transfers host when host leaves', async () => {
    const { service } = await setup();
    const { room, code } = service.createRoom('Alice', 'socket1');
    service.joinRoom(code, 'Bob', 'socket2');
    service.leaveRoom(code, 'socket1');
    expect(room.hostSocketId).toBe('socket2');
    expect(room.players.size).toBe(1);
  });

  it('deletes room when last player leaves', async () => {
    const { service } = await setup();
    const { code } = service.createRoom('Alice', 'socket1');
    const { deleted } = service.leaveRoom(code, 'socket1');
    expect(deleted).toBe(true);
  });

  it('marks player as disconnected without removing them', async () => {
    const { service } = await setup();
    const { room, code } = service.createRoom('Alice', 'socket1');
    service.joinRoom(code, 'Bob', 'socket2');
    service.markDisconnected('socket2');
    expect(room.players.get('socket2')!.status).toBe(PlayerStatus.DISCONNECTED);
    expect(room.players.size).toBe(2);
  });

  it('handles reconnect — restores player with new socket id', async () => {
    const { service } = await setup();
    const { room, code } = service.createRoom('Alice', 'socket1');
    service.joinRoom(code, 'Bob', 'socket2');
    service.markDisconnected('socket2');

    const result = service.handleReconnect(code, 'Bob', 'socket2-new');
    expect(result).not.toBeNull();
    expect(result!.player.status).toBe(PlayerStatus.CONNECTED);
    expect(room.players.has('socket2-new')).toBe(true);
    expect(room.players.has('socket2')).toBe(false);
  });

  it('toRoomDTO strips socket IDs and marks host correctly', async () => {
    const { service } = await setup();
    const { room, code } = service.createRoom('Alice', 'socket1');
    service.joinRoom(code, 'Bob', 'socket2');
    const dto = service.toRoomDTO(room);
    expect(dto.code).toBe(code);
    expect(dto.hostPseudo).toBe('Alice');
    const alice = dto.players.find((p) => p.pseudo === 'Alice');
    expect(alice?.isHost).toBe(true);
    const bob = dto.players.find((p) => p.pseudo === 'Bob');
    expect(bob?.isHost).toBe(false);
    // No socket IDs in the DTO
    expect(JSON.stringify(dto)).not.toContain('socket1');
  });
});
