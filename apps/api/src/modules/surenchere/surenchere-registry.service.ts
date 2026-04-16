import { Injectable } from '@nestjs/common';
import { SurenchereRoom, SurencherePlayer } from '@wiki-race/shared';
import { ArrayRoomRegistryService } from '../../common/game-room';

@Injectable()
export class SurenchereRegistryService extends ArrayRoomRegistryService<
  SurencherePlayer,
  SurenchereRoom
> {
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
}
