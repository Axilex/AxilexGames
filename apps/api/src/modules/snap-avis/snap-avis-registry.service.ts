import { Injectable } from '@nestjs/common';
import { ArrayRoomRegistryService } from '../../common/game-room';
import { SnapAvisRoomInternal, SnapAvisPlayerInternal } from './snap-avis-room.types';

@Injectable()
export class SnapAvisRegistryService extends ArrayRoomRegistryService<
  SnapAvisPlayerInternal,
  SnapAvisRoomInternal
> {
  createRoom(code: string, host: SnapAvisPlayerInternal): SnapAvisRoomInternal {
    const room: SnapAvisRoomInternal = {
      code,
      hostSocketId: host.socketId,
      players: [host],
      phase: 'WAITING',
      settings: {
        totalRounds: 8,
        revealDurationMs: 3000,
        writingDurationMs: 10000,
      },
      currentRound: 0,
      currentImage: null,
      roundResults: null,
      writingTimerEndsAt: null,
      imageQueue: [],
    };
    this.registerRoom(room);
    this.bindSocket(host.socketId, code);
    return room;
  }
}
