import { Injectable } from '@nestjs/common';
import { Room, Player } from '@wiki-race/shared';
import { GameStatus } from '@wiki-race/shared';

@Injectable()
export class RoomRegistryService {
  private readonly rooms = new Map<string, Room>();
  /** socketId → roomCode for fast lookup on disconnect */
  private readonly socketToRoom = new Map<string, string>();

  createRoom(code: string, host: Player): Room {
    const room: Room = {
      code,
      hostSocketId: host.socketId,
      chooserSocketId: null,
      players: new Map([[host.socketId, host]]),
      status: GameStatus.WAITING,
      game: null,
    };
    this.rooms.set(code, room);
    this.socketToRoom.set(host.socketId, code);
    return room;
  }

  findRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  findRoomBySocketId(socketId: string): Room | undefined {
    const code = this.socketToRoom.get(socketId);
    return code ? this.rooms.get(code) : undefined;
  }

  addPlayer(code: string, player: Player): void {
    const room = this.rooms.get(code);
    if (!room) throw new Error(`Room ${code} not found`);
    room.players.set(player.socketId, player);
    this.socketToRoom.set(player.socketId, code);
  }

  removePlayer(code: string, socketId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.players.delete(socketId);
    this.socketToRoom.delete(socketId);
  }

  deleteRoom(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    for (const socketId of room.players.keys()) {
      this.socketToRoom.delete(socketId);
    }
    this.rooms.delete(code);
  }

  updateSocketId(oldSocketId: string, newSocketId: string, code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.get(oldSocketId);
    if (!player) return;
    player.socketId = newSocketId;
    room.players.delete(oldSocketId);
    room.players.set(newSocketId, player);
    this.socketToRoom.delete(oldSocketId);
    this.socketToRoom.set(newSocketId, code);
    if (room.hostSocketId === oldSocketId) {
      room.hostSocketId = newSocketId;
    }
    if (room.chooserSocketId === oldSocketId) {
      room.chooserSocketId = newSocketId;
    }
  }

  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    do {
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
        '',
      );
    } while (this.rooms.has(code));
    return code;
  }
}
