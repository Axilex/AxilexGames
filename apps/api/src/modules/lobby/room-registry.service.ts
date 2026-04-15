import { Injectable } from '@nestjs/common';
import { Room, Player, GameStatus } from '@wiki-race/shared';
import { MapRoomRegistryService } from '../../common/game-room';

@Injectable()
export class RoomRegistryService extends MapRoomRegistryService<Player, Room> {
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

  override rebindSocket(oldSocketId: string, newSocketId: string, code: string): void {
    super.rebindSocket(oldSocketId, newSocketId, code);
    const room = this.rooms.get(code);
    if (room?.chooserSocketId === oldSocketId) room.chooserSocketId = newSocketId;
  }
}
