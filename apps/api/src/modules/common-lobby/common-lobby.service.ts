import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PlayerStatus } from '@wiki-race/shared';
import { GameChoice } from '@wiki-race/shared';
import { CommonLobbyRegistryService } from './common-lobby-registry.service';
import { CommonRoom, CommonPlayer } from './common-lobby.types';

const MAX_PLAYERS = 8;

@Injectable()
export class CommonLobbyService {
  constructor(private readonly registry: CommonLobbyRegistryService) {}

  createRoom(pseudo: string, socketId: string): { room: CommonRoom; sessionToken: string } {
    const code = this.registry.generateCode();
    const host: CommonPlayer = {
      socketId,
      pseudo,
      status: PlayerStatus.CONNECTED,
      isHost: true,
      sessionToken: randomUUID(),
    };
    return { room: this.registry.createRoom(code, host), sessionToken: host.sessionToken! };
  }

  joinRoom(
    roomCode: string,
    pseudo: string,
    socketId: string,
    sessionToken?: string,
  ): { room: CommonRoom; sessionToken: string } {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    // Reconnect or return from game: same pseudo already has a slot.
    const existing = Array.from(room.players.values()).find((p) => p.pseudo === pseudo);
    if (existing) {
      // Same socket re-emitting join (e.g. page mount after create) — no-op.
      if (existing.socketId === socketId) {
        existing.status = PlayerStatus.CONNECTED;
        return { room, sessionToken: existing.sessionToken ?? '' };
      }
      // Different socket trying to claim a CONNECTED pseudo = impersonation. Refuse.
      if (existing.status === PlayerStatus.CONNECTED) {
        throw new Error('PSEUDO_TAKEN');
      }
      // Legitimate reconnection of a DISCONNECTED player — must present matching token.
      if (existing.sessionToken !== null && sessionToken !== existing.sessionToken) {
        throw new Error('INVALID_SESSION_TOKEN');
      }
      if (existing.sessionToken === null) existing.sessionToken = randomUUID();
      this.registry.rebindSocket(existing.socketId, socketId, roomCode);
      existing.status = PlayerStatus.CONNECTED;
      return { room, sessionToken: existing.sessionToken };
    }

    // New player: cannot join while a game is in progress
    if (room.status === 'IN_GAME') throw new Error('GAME_IN_PROGRESS');
    if (room.players.size >= MAX_PLAYERS) throw new Error('ROOM_FULL');

    const player: CommonPlayer = {
      socketId,
      pseudo,
      status: PlayerStatus.CONNECTED,
      isHost: false,
      sessionToken: randomUUID(),
    };
    this.registry.addPlayer(roomCode, player);
    return { room, sessionToken: player.sessionToken! };
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

  /**
   * Returns the previous socketId of a DISCONNECTED player matching `pseudo`,
   * or null if none. Used by the gateway to clear the ghost-purge timer keyed
   * by the old socket id on reconnect (the new socket never had a timer).
   */
  findReconnectSocketId(roomCode: string, pseudo: string): string | null {
    const room = this.registry.findRoom(roomCode);
    if (!room) return null;
    const existing = Array.from(room.players.values()).find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    return existing?.socketId ?? null;
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

  resetToWaiting(socketId: string): CommonRoom {
    const room = this.registry.findRoomBySocketId(socketId);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    room.status = 'WAITING';
    room.gameChoice = null;
    for (const player of room.players.values()) {
      player.status = PlayerStatus.CONNECTED;
    }
    return room;
  }
}
