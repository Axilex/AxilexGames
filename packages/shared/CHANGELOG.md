# @wiki-race/shared

## 1.0.0

### Major Changes

- test gcp deploy

## 0.1.0

### Minor Changes

- ## WikiRace Multiplayer — initial feature release

  ### Backend (api)

  **5 game modes implemented**
  - `CLASSIC` — premier à atteindre la page cible gagne
  - `SPRINT` — même règle avec limite de temps obligatoire
  - `LABYRINTH` — limite de clics ; épuiser ses clics = élimination
  - `DRIFT` — score basé sur un objectif (année la plus ancienne / article le plus court / plus d'images) ; classement final quand tous les joueurs ont terminé
  - `BINGO` — valider des contraintes prédéfinies en visitant des articles ; gagne le premier à toutes les cocher

  **ModeService** — logique pure et injectable
  - `computeDriftScore(objective, html, slug)` — calcule le score Drift selon l'objectif choisi
  - `checkConstraints(ids, slug, html)` — vérifie les contraintes Bingo sur chaque page visitée (ancré sur la classe CSS `infobox` pour éviter les faux positifs)
  - `rankDriftPlayers` — tri par meilleur score, départage par nombre de clics

  **Améliorations Wikipedia**
  - Sanitizer HTML : images et infoboxes autorisées (`img`, `figure`, `figcaption`) depuis `upload.wikimedia.org` uniquement
  - Liens dans les notes de bas de page (`<sup>`) supprimés — ne comptent plus comme navigation
  - Recherche d'articles via OpenSearch API (`GET /wiki/search?q=`)

  **Socket.IO & fiabilité**
  - Keepalive configuré (`pingInterval: 10000`, `pingTimeout: 5000`, `transports: ['websocket']`)
  - `choosing:preview` — le chooser diffuse ses sélections en temps réel aux autres joueurs pendant la phase CHOOSING
  - `room:reset` — l'hôte peut relancer une partie depuis l'écran de résumé

  ### Frontend (web)

  **Nouveaux composants de jeu**
  - `BingoCard` — affiche les contraintes à valider avec état coché/non coché
  - `DriftScoreDisplay` — score Drift en temps réel pendant la partie
  - `RulesCard` — carte persistante toujours visible (lobby + sidebar jeu) listant les 5 modes et les 10 contraintes Bingo

  **Nouveaux composants de lobby**
  - `ModeSelector` — sélection du mode parmi les 5 disponibles
  - `ClickLimitSelector` — presets + saisie libre + option ∞ illimité
  - `DriftObjectiveSelector` — choix de l'objectif Drift
  - `BingoConstraintPicker` — sélection de 4 à 6 contraintes parmi 10

  **Nouveaux composants de résumé**
  - `DriftLeaderboard` — classement final avec scores et meilleurs articles
  - `BingoBoardSummary` — tableau récapitulatif des contraintes validées par joueur

  **Live choosing preview**
  - Les joueurs non-chooser voient les sélections du chooser (mode + options) se mettre à jour en temps réel via `choosing:preview`

  **Améliorations UI / UX**
  - Rendu Wikipedia enrichi : images, figures et infoboxes affichés en jeu
  - `Ctrl+F` / `Cmd+F` bloqué pendant la partie avec notification toast
  - Copie du chemin de navigation (jeu + résumé)
  - Slugs URL décodés partout (`decodeURIComponent`) — plus de `%C3%A9` affiché à l'écran
  - Header sticky sur `LobbyPage`
  - `DisconnectOverlay` affiché uniquement après la première connexion (pas de faux positif au démarrage)
  - Reconnexion manuelle via bouton dans l'overlay (pas d'auto-rejoin)
  - Guard hôte sur "Rejouer" dans l'écran de résumé

  **Portal AxilexGames**
  - Page d'accueil `/` rebrandée en hub de jeux avec grille de cartes (`GameCard`)
  - Design system : palette stone + amber (remplace gris + bleu)

## 0.0.2

### Patch Changes

- Add changesets release workflow and scripts
