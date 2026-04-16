import { TelepathiePlayer, TelepathieRoom } from '@wiki-race/shared';

/** État interne du joueur — ajoute `submittedWord` qui ne doit pas être sérialisé avant ROUND_RESULT */
export interface TelepathiePlayerInternal extends TelepathiePlayer {
  submittedWord: string | null;
}

/** État interne de la room — utilise TelepathiePlayerInternal */
export interface TelepathieRoomInternal extends Omit<TelepathieRoom, 'players'> {
  players: TelepathiePlayerInternal[];
}
