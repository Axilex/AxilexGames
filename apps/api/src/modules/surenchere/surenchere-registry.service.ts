import { Injectable } from '@nestjs/common';
import { SurenchereRoom, SurencherePlayer } from '@wiki-race/shared';

@Injectable()
export class SurenchereRegistryService {
  private readonly rooms = new Map<string, SurenchereRoom>();
  private readonly socketToRoom = new Map<string, string>();

  createRoom(code: string, host: SurencherePlayer, totalRounds: number, startBid: number): SurenchereRoom {
    const room: SurenchereRoom = {
      code,
      phase: 'WAITING',
      players: [host],
      settings: { totalRounds, startBid },
      currentRound: 0,
      currentChallenge: null,
      challengeOptions: [],
      challengeChooserSocketId: null,
      currentBid: 0,
      currentBidderSocketId: null,
      passedSocketIds: [],
      currentWords: null,
      wasForced: false,
      roundStarterIndex: 0,
      lastRoundResult: null,
    };
    this.rooms.set(code, room);
    this.socketToRoom.set(host.socketId, code);
    return room;
  }

  findRoom(code: string): SurenchereRoom | undefined {
    return this.rooms.get(code);
  }

  findRoomBySocketId(socketId: string): SurenchereRoom | undefined {
    const code = this.socketToRoom.get(socketId);
    return code ? this.rooms.get(code) : undefined;
  }

  addPlayer(code: string, player: SurencherePlayer): void {
    const room = this.rooms.get(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    room.players.push(player);
    this.socketToRoom.set(player.socketId, code);
  }

  removePlayer(code: string, socketId: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.players = room.players.filter((p) => p.socketId !== socketId);
    this.socketToRoom.delete(socketId);
  }

  deleteRoom(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    for (const p of room.players) this.socketToRoom.delete(p.socketId);
    this.rooms.delete(code);
  }

  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    do {
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
        '',
      );
    } while (this.rooms.has(code));
    return code;
  }
}
