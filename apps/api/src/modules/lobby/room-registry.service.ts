import { Injectable } from '@nestjs/common';
import { Room, Player, GameStatus } from '@wiki-race/shared';
import { BaseRoomRegistryService } from '../../common/game-room';

@Injectable()
export class RoomRegistryService extends BaseRoomRegistryService<Room> {
  createRoom(code: string, host: Player): Room {
    const room: Room = {
      code,
      hostSocketId: host.socketId,
      chooserSocketId: null,
      players: new Map([[host.socketId, host]]),
      status: GameStatus.WAITING,
      game: null,
    };
    this.registerRoom(room);
    this.bindSocket(host.socketId, code);
    return room;
  }

  addPlayer(code: string, player: Player): void {
    const room = this.rooms.get(code);
    if (!room) throw new Error(`Room ${code} not found`);
    room.players.set(player.socketId, player);
    this.bindSocket(player.socketId, code);
  }

  removePlayer(code: string, socketId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.players.delete(socketId);
    this.unbindSocket(socketId);
  }

  updateSocketId(oldSocketId: string, newSocketId: string, code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.get(oldSocketId);
    if (!player) return;
    player.socketId = newSocketId;
    room.players.delete(oldSocketId);
    room.players.set(newSocketId, player);
    this.unbindSocket(oldSocketId);
    this.bindSocket(newSocketId, code);
    if (room.hostSocketId === oldSocketId) {
      room.hostSocketId = newSocketId;
    }
    if (room.chooserSocketId === oldSocketId) {
      room.chooserSocketId = newSocketId;
    }
  }
}
