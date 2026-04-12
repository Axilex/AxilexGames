# @wiki-race/shared

## 0.3.2

### Patch Changes

- ### 🐛 Corrections
  - [`6ca8094`](https://github.com/Axilex/AxilexGames/commit/6ca8094) add optional chaining for voting progress and initialize wordVotes in store tests

## 0.3.1

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`d9737bd`](https://github.com/Axilex/AxilexGames/commit/d9737bd) enhance lobby and game functionality with share links and voting system

  ### ♻️ Refactoring
  - [`6a5a6cd`](https://github.com/Axilex/AxilexGames/commit/6a5a6cd) game modes and remove Drift-related features

  ### 🔧 Maintenance
  - [`01e56f4`](https://github.com/Axilex/AxilexGames/commit/01e56f4) enhance auto-changeset and release scripts with structured changelog generation

## 0.3.0

### Minor Changes

- Add surenchere mode beta version

## 0.2.9

### Patch Changes

- - refactor: update socket event names and restructure reconnection logic
  - feat(surenchere): add Surenchère game functionality

## 0.2.8

### Patch Changes

- - fix: update web deployment strategy and probe configurations
  - chore: remove obsolete deployment and setup documentation files

## 0.2.7

### Patch Changes

- set up volume

## 0.2.6

### Patch Changes

- add dns

## 0.2.5

### Patch Changes

- fix domain

## 0.2.4

### Patch Changes

- add domain config

## 0.2.3

### Patch Changes

- add option

## 0.2.2

### Patch Changes

- fix config and api dockerfile

## 0.2.1

### Patch Changes

- fix ports

## 0.2.0

### Minor Changes

- config env variable
- Config ip

## 0.1.0

### Minor Changes

- config for gcp

## 0.0.2

### Patch Changes

- First release

## 1.1.0

### Minor Changes

- fix docker file

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
