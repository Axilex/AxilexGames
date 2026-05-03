import { randomInt } from 'node:crypto';
import { BaseRoom } from './base-room.interface';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/**
 * Generic room storage shared by every mini-game.
 *
 * Holds `Map<code, Room>` + `Map<socketId, code>` for O(1) lookup on disconnect,
 * plus a unique-code generator. Subclasses add their own player CRUD on top.
 *
 * ## Host-transfer convention
 * Modules that designate a host must implement host transfer themselves using one of
 * these two patterns — pick the one that matches the room's player storage:
 *
 * - **MapRoomRegistryService** (`hostSocketId` is a declared field on the room): override
 *   `transferHostIfNeeded` (see `CommonLobbyRegistryService`).
 * - **ArrayRoomRegistryService** (`hostSocketId?` on `RoomWithArrayPlayers`): override
 *   `transferHostIfNeeded` (see `TelepathieRegistryService`) — `rebindSocket` already
 *   keeps `hostSocketId` in sync on reconnect.
 * - **Inline in the service**: acceptable for leaf games where the registry is thin
 *   (e.g. `SnapAvisService.leaveRoom`), but prefer the override pattern for consistency.
 */
export abstract class BaseRoomRegistryService<R extends BaseRoom> {
  protected readonly rooms = new Map<string, R>();
  protected readonly socketToRoom = new Map<string, string>();

  findRoom(code: string): R | undefined {
    return this.rooms.get(code);
  }

  findRoomBySocketId(socketId: string): R | undefined {
    const code = this.socketToRoom.get(socketId);
    return code ? this.rooms.get(code) : undefined;
  }

  protected registerRoom(room: R): void {
    this.rooms.set(room.code, room);
  }

  protected bindSocket(socketId: string, code: string): void {
    this.socketToRoom.set(socketId, code);
  }

  protected unbindSocket(socketId: string): void {
    this.socketToRoom.delete(socketId);
  }

  deleteRoom(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    for (const [socketId, boundCode] of this.socketToRoom) {
      if (boundCode === code) this.socketToRoom.delete(socketId);
    }
    this.rooms.delete(code);
  }

  generateCode(): string {
    // Uses a CSPRNG (`crypto.randomInt`) so codes can't be predicted from a
    // seed — knowing one code shouldn't help guess the next active room.
    let code: string;
    do {
      code = Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join(
        '',
      );
    } while (this.rooms.has(code));
    return code;
  }
}
