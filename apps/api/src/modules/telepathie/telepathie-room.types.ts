import { TelepathiePlayer, TelepathieRoom } from '@wiki-race/shared';

/** État interne du joueur — ajoute `submittedWord` qui ne doit pas être sérialisé avant ROUND_RESULT */
export interface TelepathiePlayerInternal extends TelepathiePlayer {
  submittedWord: string | null;
  /** Version affichable (avec accents) du mot soumis — envoyée dans les résultats. */
  submittedWordDisplay: string | null;
  /** Mots déjà utilisés dans la manche courante (normalisés) — empêche les doublons */
  usedWords: string[];
}

/** État interne de la room — utilise TelepathiePlayerInternal */
export interface TelepathieRoomInternal extends Omit<TelepathieRoom, 'players'> {
  players: TelepathiePlayerInternal[];
}
