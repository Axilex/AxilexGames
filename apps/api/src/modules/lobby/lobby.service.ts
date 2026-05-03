import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Room, Player, RoomDTO, PlayerDTO, GameStatus, PlayerStatus } from '@wiki-race/shared';
import { RoomRegistryService } from './room-registry.service';

const MAX_PLAYERS = 8;

@Injectable()
export class LobbyService {
  constructor(private readonly registry: RoomRegistryService) {}

  seedRoom(code: string, players: Array<{ pseudo: string; isHost: boolean }>): void {
    this.registry.deleteRoom(code); // clean up any previous room with this code
    const hostPlayer = players.find((p) => p.isHost) ?? players[0];
    const host = {
      ...this.makePlayer(`seed-${hostPlayer.pseudo}`, hostPlayer.pseudo),
      status: PlayerStatus.DISCONNECTED,
      sessionToken: null,
    };
    this.registry.createRoom(code, host);
    for (const p of players.filter((pl) => !pl.isHost)) {
      this.registry.addPlayer(code, {
        ...this.makePlayer(`seed-${p.pseudo}`, p.pseudo),
        status: PlayerStatus.DISCONNECTED,
        sessionToken: null,
      });
    }
  }

  createRoom(pseudo: string, socketId: string): { room: Room; code: string; sessionToken: string } {
    const code = this.registry.generateCode();
    const host = this.makePlayer(socketId, pseudo);
    const room = this.registry.createRoom(code, host);
    return { room, code, sessionToken: host.sessionToken! };
  }

  startChoosing(roomCode: string, hostSocketId: string): Room {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== hostSocketId) throw new Error('NOT_HOST');
    if (room.status !== GameStatus.WAITING) throw new Error('ROOM_NOT_WAITING');

    const connected = Array.from(room.players.values()).filter(
      (p) => p.status === PlayerStatus.CONNECTED,
    );
    if (connected.length === 0) throw new Error('NO_PLAYERS');

    const chooser = connected[Math.floor(Math.random() * connected.length)];
    room.chooserSocketId = chooser.socketId;
    room.status = GameStatus.CHOOSING;
    return room;
  }

  joinRoom(
    roomCode: string,
    pseudo: string,
    socketId: string,
  ): { room: Room; sessionToken: string } {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.status === GameStatus.IN_PROGRESS || room.status === GameStatus.CHOOSING)
      throw new Error('GAME_IN_PROGRESS');

    const players = Array.from(room.players.values());
    if (players.length >= MAX_PLAYERS) throw new Error('ROOM_FULL');
    if (players.some((p) => p.pseudo === pseudo)) throw new Error('PSEUDO_TAKEN');

    const player = this.makePlayer(socketId, pseudo);
    this.registry.addPlayer(roomCode, player);
    return { room, sessionToken: player.sessionToken! };
  }

  leaveRoom(roomCode: string, socketId: string): { room: Room | null; deleted: boolean } {
    const room = this.registry.findRoom(roomCode);
    if (!room) return { room: null, deleted: true };

    this.registry.removePlayer(roomCode, socketId);

    if (room.players.size === 0) {
      this.registry.deleteRoom(roomCode);
      return { room: null, deleted: true };
    }

    this.registry.transferHostIfNeeded(room, socketId);
    return { room, deleted: false };
  }

  markDisconnected(socketId: string): Room | null {
    return this.registry.markDisconnected(socketId);
  }

  handleReconnect(
    roomCode: string,
    pseudo: string,
    newSocketId: string,
    sessionToken?: string,
  ): {
    room: Room;
    player: Player;
    previousSocketId: string;
    sessionToken: string;
  } | null {
    const room = this.registry.findRoom(roomCode);
    if (!room) return null;

    const existing = Array.from(room.players.values()).find(
      (p) => p.pseudo === pseudo && p.status === PlayerStatus.DISCONNECTED,
    );
    if (!existing) return null;

    // Seed players (created by common-lobby redirect) have a null token until
    // the first claim. For everyone else, the client must present the token
    // we issued at create/join time — otherwise this is a hijack attempt.
    if (existing.sessionToken !== null) {
      if (sessionToken !== existing.sessionToken) {
        throw new Error('INVALID_SESSION_TOKEN');
      }
    } else {
      // First claim of a seeded slot — issue a fresh token.
      existing.sessionToken = randomUUID();
    }

    const previousSocketId = existing.socketId;
    this.registry.rebindSocket(previousSocketId, newSocketId, roomCode);
    existing.status = PlayerStatus.CONNECTED;
    return { room, player: existing, previousSocketId, sessionToken: existing.sessionToken };
  }

  resetRoom(roomCode: string, socketId: string): Room {
    const room = this.registry.findRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostSocketId !== socketId) throw new Error('NOT_HOST');
    if (room.status === GameStatus.IN_PROGRESS) throw new Error('GAME_IN_PROGRESS');
    room.status = GameStatus.WAITING;
    room.chooserSocketId = null;
    room.game = null;
    for (const player of room.players.values()) {
      if (player.status === PlayerStatus.FINISHED || player.status === PlayerStatus.SURRENDERED) {
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

    const chooserPlayer = room.chooserSocketId ? room.players.get(room.chooserSocketId) : null;
    const chooserPseudo = chooserPlayer?.pseudo ?? null;

    const players: PlayerDTO[] = Array.from(room.players.values()).map((p) => ({
      pseudo: p.pseudo,
      status: p.status,
      isHost: p.socketId === room.hostSocketId,
    }));

    return { code: room.code, status: room.status, players, hostPseudo, chooserPseudo };
  }

  private makePlayer(socketId: string, pseudo: string): Player {
    return {
      socketId,
      pseudo,
      status: PlayerStatus.CONNECTED,
      currentSlug: '',
      history: [],
      lastNavigationAt: 0,
      bingoValidated: [],
      bingoValidatedOnSlug: {},
      sessionToken: randomUUID(),
    };
  }
}
