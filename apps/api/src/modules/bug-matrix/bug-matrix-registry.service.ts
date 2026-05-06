import { Injectable } from '@nestjs/common';
import { BugMatrixSettings, PlayerStatus } from '@wiki-race/shared';
import { ArrayRoomRegistryService } from '../../common/game-room';
import { BugMatrixPlayerInternal, BugMatrixRoomInternal } from './bug-matrix-room.types';

@Injectable()
export class BugMatrixRegistryService extends ArrayRoomRegistryService<
  BugMatrixPlayerInternal,
  BugMatrixRoomInternal
> {
  createRoom(
    code: string,
    host: BugMatrixPlayerInternal,
    settings: BugMatrixSettings,
  ): BugMatrixRoomInternal {
    const room: BugMatrixRoomInternal = {
      code,
      status: 'WAITING',
      phase: 'WAITING',
      round: 0,
      themeLabel: null,
      players: [host],
      settings,
      hostPseudo: host.pseudo,
      currentQuestion: null,
      discussionTimerEndsAt: null,
      voteTimerEndsAt: null,
      lastResult: null,
      voteMap: {},
      questionPool: [],
      currentQuestionIndex: 0,
    };
    this.registerRoom(room);
    this.bindSocket(host.socketId, code);
    return room;
  }

  /** Override: prefer a CONNECTED player when transferring host. */
  transferHostIfNeeded(room: BugMatrixRoomInternal, leavingSocketId: string): void {
    const leaver = room.players.find((p) => p.socketId === leavingSocketId);
    if (!leaver?.isHost) return;
    const next =
      room.players.find((p) => p.status === PlayerStatus.CONNECTED && p.socketId !== leavingSocketId) ??
      room.players.find((p) => p.socketId !== leavingSocketId);
    if (next) {
      next.isHost = true;
      room.hostPseudo = next.pseudo;
    }
  }
}
