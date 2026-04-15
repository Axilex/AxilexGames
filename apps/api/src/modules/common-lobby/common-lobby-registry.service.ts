import { Injectable } from '@nestjs/common';
import { CommonPlayerDTO, CommonRoomDTO } from '@wiki-race/shared';
import { MapRoomRegistryService } from '../../common/game-room';
import { CommonRoom, CommonPlayer } from './common-lobby.types';

@Injectable()
export class CommonLobbyRegistryService extends MapRoomRegistryService<CommonPlayer, CommonRoom> {
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
