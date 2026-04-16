import { Injectable } from '@nestjs/common';
import { PlayerStatus } from '@wiki-race/shared';
import { ArrayRoomRegistryService } from '../../common/game-room';
import { TelepathieRoomInternal, TelepathiePlayerInternal } from './telepathie-room.types';
import { DEFAULT_TELEPATHIE_SETTINGS } from './words.data';

@Injectable()
export class TelepathieRegistryService extends ArrayRoomRegistryService<
  TelepathiePlayerInternal,
  TelepathieRoomInternal
> {
  createRoom(code: string, host: TelepathiePlayerInternal): TelepathieRoomInternal {
    const room: TelepathieRoomInternal = {
      code,
      hostSocketId: host.socketId,
      players: [host],
      phase: 'WAITING',
      settings: { ...DEFAULT_TELEPATHIE_SETTINGS },
      currentManche: 0,
      currentSousRound: 0,
      mancheResults: [],
      lastRoundResult: null,
      roundTimerEndsAt: null,
    };
    this.registerRoom(room);
    this.bindSocket(host.socketId, code);
    return room;
  }

  transferHostIfNeeded(room: TelepathieRoomInternal, leftSocketId: string): void {
    if (room.hostSocketId !== leftSocketId) return;
    const next = room.players.find((p) => p.status === PlayerStatus.CONNECTED);
    if (next) {
      room.hostSocketId = next.socketId;
      next.isHost = true;
    }
  }
}
