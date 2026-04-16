import { Injectable } from '@nestjs/common';
import { PlayerStatus } from '@wiki-race/shared';
import { BaseRoomRegistryService } from '../../common/game-room';
import { SnapAvisRoomInternal, SnapAvisPlayerInternal } from './snap-avis-room.types';

@Injectable()
export class SnapAvisRegistryService extends BaseRoomRegistryService<SnapAvisRoomInternal> {
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

  addPlayer(code: string, player: SnapAvisPlayerInternal): void {
    const room = this.rooms.get(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    room.players.push(player);
    this.bindSocket(player.socketId, code);
  }

  removePlayer(code: string, socketId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.players = room.players.filter((p) => p.socketId !== socketId);
    this.unbindSocket(socketId);
  }

  rebindSocket(oldSocketId: string, newSocketId: string, code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === oldSocketId);
    if (!player) return;
    player.socketId = newSocketId;
    this.unbindSocket(oldSocketId);
    this.bindSocket(newSocketId, code);
  }

  markDisconnected(socketId: string): SnapAvisRoomInternal | null {
    const room = this.findRoomBySocketId(socketId);
    if (!room) return null;
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) player.status = PlayerStatus.DISCONNECTED;
    return room;
  }
}
