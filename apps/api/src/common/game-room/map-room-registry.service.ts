import { PlayerStatus } from '@wiki-race/shared';
import { BaseRoom } from './base-room.interface';
import { BaseRoomRegistryService } from './base-room-registry.service';

export interface RoomWithMappedPlayers<
  P extends { socketId: string; status: PlayerStatus },
> extends BaseRoom {
  players: Map<string, P>;
  hostSocketId: string;
}

/**
 * Intermediate base for registries whose rooms store players in a `Map<socketId, Player>`.
 * Provides concrete `addPlayer`, `removePlayer`, `rebindSocket`, `markDisconnected`,
 * and `transferHostIfNeeded` implementations.
 * Subclasses only need to implement `createRoom` (and override `rebindSocket` for extra
 * socket-id fields, e.g. `chooserSocketId`).
 */
export abstract class MapRoomRegistryService<
  P extends { socketId: string; status: PlayerStatus },
  R extends RoomWithMappedPlayers<P>,
> extends BaseRoomRegistryService<R> {
  addPlayer(code: string, player: P): void {
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

  /** Marks the player as DISCONNECTED and returns the room, or null if not found. */
  markDisconnected(socketId: string): R | null {
    const room = this.findRoomBySocketId(socketId);
    if (!room) return null;
    const player = room.players.get(socketId);
    if (player) player.status = PlayerStatus.DISCONNECTED;
    return room;
  }

  /** Assigns the next available player as host when the current host leaves. */
  transferHostIfNeeded(room: R, leavingSocketId: string): void {
    if (room.hostSocketId === leavingSocketId && room.players.size > 0) {
      room.hostSocketId = room.players.values().next().value!.socketId;
    }
  }
}
