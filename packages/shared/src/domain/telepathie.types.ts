import { PlayerStatus } from './enums';

export type TelepathiePhase =
  | 'WAITING'
  | 'CHOOSING' // chaque joueur choisit son mot de départ pour la manche
  | 'PLAYING' // sous-round en cours
  | 'ROUND_RESULT' // résultat d'un sous-round (auto-continue si pas de match)
  | 'MANCHE_RESULT' // fin de manche (match trouvé ou max sous-rounds atteint)
  | 'FINISHED';

export interface TelepathiePlayer {
  socketId: string;
  pseudo: string;
  score: number;
  status: PlayerStatus;
  isHost: boolean;
  /** Mot de départ du sous-round actuel — visible par tous */
  currentWord: string | null;
  /** Indique si le joueur a soumis ce sous-round */
  hasSubmitted: boolean;
}

export interface TelepathieSettings {
  totalManches: number; // nombre de manches à jouer (défaut : 5)
  maxSousRounds: number; // sous-rounds max par manche avant abandon (défaut : 10)
  roundTimerSeconds: number; // secondes par sous-round (défaut : 30)
}

export interface TelepathieSousRoundResult {
  manche: number;
  sousRound: number;
  /** pseudo → mot soumis (normalisé) */
  submissions: Record<string, string>;
  /** groupes de 2+ joueurs ayant le même mot */
  winnerGroups: string[][];
  hasMatch: boolean;
}

export interface TelepathieMancheResult {
  manche: number;
  sousRoundsPlayed: number;
  hasMatch: boolean;
  /** pseudos des joueurs qui ont trouvé le match (+1 point chacun) */
  winners: string[];
}

export interface TelepathieRankEntry {
  pseudo: string;
  score: number;
  rank: number;
}

export interface TelepathieRoom {
  code: string;
  hostSocketId: string;
  players: TelepathiePlayer[];
  phase: TelepathiePhase;
  settings: TelepathieSettings;
  currentManche: number;
  currentSousRound: number;
  mancheResults: TelepathieMancheResult[];
  lastRoundResult: TelepathieSousRoundResult | null;
  roundTimerEndsAt: number | null;
}

export type TelepathieRoomDTO = TelepathieRoom;
