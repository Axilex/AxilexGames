import { PlayerProgressDTO } from './player-progress.dto';

export interface GameStateDTO {
  roomCode: string;
  startSlug: string;
  targetSlug: string;
  startTime: number;
  timeLimitSeconds: number | null;
  playerStatuses: PlayerProgressDTO[];
}
