import { PlayerStatus } from '@wiki-race/shared';
import { BaseRoom } from './base-room.interface';
import { BaseRoomRegistryService } from './base-room-registry.service';

export interface RoomWithArrayPlayers<
  P extends { socketId: string; status: PlayerStatus },
> extends BaseRoom {
  players: P[];
}

/**
 * Intermediate base for registries whose rooms store players in a `players: P[]` array.
 *
 * Provides concrete `addPlayer`, `removePlayer`, `rebindSocket`, and `markDisconnected`.
 * Subclasses only need to implement `createRoom` and any game-specific extras
 * (e.g. `transferHostIfNeeded`).
 */
export abstract class ArrayRoomRegistryService<
  P extends { socketId: string; status: PlayerStatus },
  R extends RoomWithArrayPlayers<P>,
> extends BaseRoomRegistryService<R> {
  addPlayer(code: string, player: P): void {
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
    // Rooms that track the host via `hostSocketId` (telepathie, snap-avis) must
    // follow the rebind too, otherwise the host check on startGame fails after a
    // common-lobby seed → real-socket swap.
    const roomWithHost = room as R & { hostSocketId?: string };
    if (roomWithHost.hostSocketId === oldSocketId) {
      roomWithHost.hostSocketId = newSocketId;
    }
    this.unbindSocket(oldSocketId);
    this.bindSocket(newSocketId, code);
  }

  /** Marks the player as DISCONNECTED and returns the room, or null if not found. */
  markDisconnected(socketId: string): R | null {
    const room = this.findRoomBySocketId(socketId);
    if (!room) return null;
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) player.status = PlayerStatus.DISCONNECTED;
    return room;
  }
}
