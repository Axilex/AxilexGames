import { Injectable } from '@nestjs/common';
import { CommonPlayerDTO, CommonRoomDTO } from '@wiki-race/shared';
import { BaseRoomRegistryService } from '../../common/game-room';
import { CommonRoom, CommonPlayer } from './common-lobby.types';

@Injectable()
export class CommonLobbyRegistryService extends BaseRoomRegistryService<CommonRoom> {
  createRoom(code: string, host: CommonPlayer): CommonRoom {
    const room: CommonRoom = {
      code,
      status: 'WAITING',
      gameChoice: null,
      hostSocketId: host.socketId,
      players: new Map([[host.socketId, host]]),
    };
    this.registerRoom(room);
    this.bindSocket(host.socketId, code);
    return room;
  }

  addPlayer(code: string, player: CommonPlayer): void {
    const room = this.rooms.get(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    room.players.set(player.socketId, player);
    this.bindSocket(player.socketId, code);
  }

  removePlayer(code: string, socketId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.players.delete(socketId);
    this.unbindSocket(socketId);
  }

  rebindSocket(oldSocketId: string, newSocketId: string, code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.get(oldSocketId);
    if (!player) return;
    player.socketId = newSocketId;
    room.players.delete(oldSocketId);
    room.players.set(newSocketId, player);
    if (room.hostSocketId === oldSocketId) room.hostSocketId = newSocketId;
    this.unbindSocket(oldSocketId);
    this.bindSocket(newSocketId, code);
  }

  toDTO(room: CommonRoom): CommonRoomDTO {
    const hostPlayer = room.players.get(room.hostSocketId);
    const players: CommonPlayerDTO[] = Array.from(room.players.values()).map((p) => ({
      pseudo: p.pseudo,
      status: p.status,
      isHost: p.socketId === room.hostSocketId,
    }));
    return {
      code: room.code,
      status: room.status,
      gameChoice: room.gameChoice,
      players,
      hostPseudo: hostPlayer?.pseudo ?? '',
    };
  }
}
