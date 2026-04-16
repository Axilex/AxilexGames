import { Injectable } from '@nestjs/common';
import { PlayerStatus } from '@wiki-race/shared';
import { BaseRoomRegistryService } from '../../common/game-room';
import { TelepathieRoomInternal, TelepathiePlayerInternal } from './telepathie-room.types';
import { DEFAULT_TELEPATHIE_SETTINGS } from './words.data';

@Injectable()
export class TelepathieRegistryService extends BaseRoomRegistryService<TelepathieRoomInternal> {
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

  addPlayer(code: string, player: TelepathiePlayerInternal): void {
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

  markDisconnected(socketId: string): TelepathieRoomInternal | null {
    const room = this.findRoomBySocketId(socketId);
    if (!room) return null;
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) player.status = PlayerStatus.DISCONNECTED;
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
