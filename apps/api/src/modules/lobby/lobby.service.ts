import { Injectable } from '@nestjs/common';
import { Room, Player, RoomDTO, PlayerDTO, GameStatus, PlayerStatus } from '@wiki-race/shared';
import { RoomRegistryService } from './room-registry.service';

const MAX_PLAYERS = 8;

@Injectable()
export class LobbyService {
  constructor(private readonly registry: RoomRegistryService) {}

  createRoom(pseudo: string, socketId: string): { room: Room; code: string } {
    const code = this.registry.generateCode();
    const host = this.makePlayer(socketId, pseudo);
    const room = this.registry.createRoom(code, host);
    return { room, code };
  }

  joinRoom(roomCode: string, pseudo: string, socketId: string): Room {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.status === GameStatus.IN_PROGRESS) throw new Error('GAME_IN_PROGRESS');

    const players = Array.from(room.players.values());
    if (players.length >= MAX_PLAYERS) throw new Error('ROOM_FULL');
    if (players.some((p) => p.pseudo === pseudo)) throw new Error('PSEUDO_TAKEN');

    const player = this.makePlayer(socketId, pseudo);
    this.registry.addPlayer(roomCode, player);
    return room;
  }

  leaveRoom(roomCode: string, socketId: string): { room: Room | null; deleted: boolean } {
    const room = this.registry.findRoom(roomCode);
    if (!room) return { room: null, deleted: true };

    this.registry.removePlayer(roomCode, socketId);

    if (room.players.size === 0) {
      this.registry.deleteRoom(roomCode);
      return { room: null, deleted: true };
    }

    // Transfer host if needed
    if (room.hostSocketId === socketId) {
      const newHost = room.players.values().next().value as Player;
      room.hostSocketId = newHost.socketId;
    }

    return { room, deleted: false };
  }

  markDisconnected(socketId: string): Room | null {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) return null;
    const player = room.players.get(socketId);
    if (player) player.status = PlayerStatus.DISCONNECTED;
    return room;
  }

  handleReconnect(
    roomCode: string,
    pseudo: string,
    newSocketId: string,
  ): { room: Room; player: Player } | null {
    const room = this.registry.findRoom(roomCode);
    if (!room) return null;

    const existing = Array.from(room.players.values()).find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    if (!existing) return null;

    this.registry.updateSocketId(existing.socketId, newSocketId, roomCode);
    existing.status = PlayerStatus.CONNECTED;
    return { room, player: existing };
  }

  resetRoom(roomCode: string, socketId: string): Room {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    room.status = GameStatus.WAITING;
    room.game = null;
    for (const player of room.players.values()) {
      if (
        player.status === PlayerStatus.FINISHED ||
        player.status === PlayerStatus.SURRENDERED
      ) {
        player.status = PlayerStatus.CONNECTED;
      }
      player.currentSlug = '';
      player.history = [];
      player.lastNavigationAt = 0;
    }
    return room;
  }

  findRoom(roomCode: string): Room | undefined {
    return this.registry.findRoom(roomCode);
  }

  toRoomDTO(room: Room): RoomDTO {
    const hostPlayer = room.players.get(room.hostSocketId);
    const hostPseudo = hostPlayer?.pseudo ?? '';

    const players: PlayerDTO[] = Array.from(room.players.values()).map((p) => ({
      pseudo: p.pseudo,
      status: p.status,
      isHost: p.socketId === room.hostSocketId,
    }));

    return { code: room.code, status: room.status, players, hostPseudo };
  }

  private makePlayer(socketId: string, pseudo: string): Player {
    return {
      socketId,
      pseudo,
      status: PlayerStatus.CONNECTED,
      currentSlug: '',
      history: [],
      lastNavigationAt: 0,
    };
  }
}
