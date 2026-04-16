import { PlayerStatus } from './enums';

export type GameChoice = 'wikirace' | 'surenchere' | 'snap-avis' | null;

export interface CommonPlayerDTO {
  pseudo: string;
  status: PlayerStatus;
  isHost: boolean;
}

export interface CommonRoomDTO {
  code: string;
  status: 'WAITING' | 'IN_GAME';
  gameChoice: GameChoice;
  players: CommonPlayerDTO[];
  hostPseudo: string;
}
