import { Injectable } from '@nestjs/common';
import { SurenchereRoom, SurencherePlayer } from '@wiki-race/shared';
import { BaseRoomRegistryService } from '../../common/game-room';

@Injectable()
export class SurenchereRegistryService extends BaseRoomRegistryService<SurenchereRoom> {
  createRoom(
    code: string,
    host: SurencherePlayer,
    totalRounds: number,
    startBid: number,
    wordTimerSeconds = 60,
  ): SurenchereRoom {
    const room: SurenchereRoom = {
      code,
      phase: 'WAITING',
      players: [host],
      settings: { totalRounds, startBid, wordTimerSeconds },
      currentRound: 0,
      currentChallenge: null,
      challengeOptions: [],
      challengeChooserSocketId: null,
      currentBid: 0,
      currentBidderSocketId: null,
      passedSocketIds: [],
      currentWords: null,
      wasForced: false,
      voteMap: {},
      roundStarterIndex: 0,
      lastRoundResult: null,
      chooseTimerEndsAt: null,
      bidTimerEndsAt: null,
      wordsTimerEndsAt: null,
    };
    this.registerRoom(room);
    this.bindSocket(host.socketId, code);
    return room;
  }

  addPlayer(code: string, player: SurencherePlayer): void {
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
}
