import { Injectable } from '@nestjs/common';
import { ArrayRoomRegistryService } from '../../common/game-room';
import { SurenchereRoomInternal, SurencherePlayerInternal } from './surenchere-room.types';

@Injectable()
export class SurenchereRegistryService extends ArrayRoomRegistryService<
  SurencherePlayerInternal,
  SurenchereRoomInternal
> {
  createRoom(
    code: string,
    host: SurencherePlayerInternal,
    totalRounds: number,
    startBid: number,
    wordTimerSeconds = 60,
  ): SurenchereRoomInternal {
    const room: SurenchereRoomInternal = {
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
