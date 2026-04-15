import { Injectable } from '@nestjs/common';
import { PlayerStatus } from '@wiki-race/shared';
import { GameChoice } from '@wiki-race/shared';
import { CommonLobbyRegistryService } from './common-lobby-registry.service';
import { CommonRoom, CommonPlayer } from './common-lobby.types';

const MAX_PLAYERS = 8;

@Injectable()
export class CommonLobbyService {
  constructor(private readonly registry: CommonLobbyRegistryService) {}

  createRoom(pseudo: string, socketId: string): CommonRoom {
    const code = this.registry.generateCode();
    const host: CommonPlayer = { socketId, pseudo, status: PlayerStatus.CONNECTED, isHost: true };
    return this.registry.createRoom(code, host);
  }

  joinRoom(roomCode: string, pseudo: string, socketId: string): CommonRoom {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.status === 'IN_GAME') throw new Error('GAME_IN_PROGRESS');

    // Reconnect: same pseudo, disconnected
    const existing = Array.from(room.players.values()).find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    if (existing) {
      this.registry.rebindSocket(existing.socketId, socketId, roomCode);
      existing.status = PlayerStatus.CONNECTED;
      return room;
    }

    if (room.players.size >= MAX_PLAYERS) throw new Error('ROOM_FULL');
    if (Array.from(room.players.values()).some((p) => p.pseudo === pseudo))
      throw new Error('PSEUDO_TAKEN');

    const player: CommonPlayer = {
      socketId,
      pseudo,
      status: PlayerStatus.CONNECTED,
      isHost: false,
    };
    this.registry.addPlayer(roomCode, player);
    return room;
  }

  leaveRoom(socketId: string): { room: CommonRoom | null; deleted: boolean } {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) return { room: null, deleted: true };

    this.registry.removePlayer(room.code, socketId);

    if (room.players.size === 0) {
      this.registry.deleteRoom(room.code);
      return { room: null, deleted: true };
    }

    this.registry.transferHostIfNeeded(room, socketId);
    return { room, deleted: false };
  }

  markDisconnected(socketId: string): CommonRoom | null {
    return this.registry.markDisconnected(socketId);
  }

  chooseGame(socketId: string, game: GameChoice): CommonRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    room.gameChoice = game;
    return room;
  }

  clearGameChoice(socketId: string): CommonRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    room.gameChoice = null;
    return room;
  }

  startRoom(socketId: string): CommonRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    if (!room.gameChoice) throw new Error('NO_GAME_CHOSEN');

    const connected = Array.from(room.players.values()).filter(
      (p) => p.status === PlayerStatus.CONNECTED,
    );
    if (connected.length < 2) throw new Error('NOT_ENOUGH_PLAYERS');

    room.status = 'IN_GAME';
    return room;
  }

  getRoom(socketId: string): CommonRoom | undefined {
    return this.registry.findRoomBySocketId(socketId);
  }

  getConnectedPlayers(room: CommonRoom): CommonPlayer[] {
    return Array.from(room.players.values()).filter((p) => p.status === PlayerStatus.CONNECTED);
  }
}
