# @wiki-race/shared

## 0.5.6

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`6e86d72`](https://github.com/Axilex/AxilexGames/commit/6e86d72) implement session token for player reconnection across games
  - [`85c3e8f`](https://github.com/Axilex/AxilexGames/commit/85c3e8f) add WikiRace module and gateway, implement reconnection and game handling logic
  - [`bea653d`](https://github.com/Axilex/AxilexGames/commit/bea653d) implement reconnect handling by adding findReconnectSocketId method and updating ghost-purge timer logic
  - [`15716ed`](https://github.com/Axilex/AxilexGames/commit/15716ed) implement game abandonment logic and integrate RoomTimerService for player reconnection handling

  ### ♻️ Refactoring
  - [`c45cd2e`](https://github.com/Axilex/AxilexGames/commit/c45cd2e) clean up code formatting and improve readability across multiple files

  ### 🔧 Maintenance
  - [`f4e59b9`](https://github.com/Axilex/AxilexGames/commit/f4e59b9) update error handling and session security in WikiRace gateway documentation
  - [`64801a2`](https://github.com/Axilex/AxilexGames/commit/64801a2) upgrade dependencies
  - [`504f87e`](https://github.com/Axilex/AxilexGames/commit/504f87e) remove claude from gitignore

## 0.5.5

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`6e6557f`](https://github.com/Axilex/AxilexGames/commit/6e6557f) enhance game logic by adding game status checks and refactoring word normalization
  - [`a0b02d6`](https://github.com/Axilex/AxilexGames/commit/a0b02d6) refactor game state management by replacing GameStateService with RoomTimerService and updating related components

## 0.5.4

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`b8193c1`](https://github.com/Axilex/AxilexGames/commit/b8193c1) add submittedWordDisplay to TelepathiePlayerInternal and update handling in TelepathieService

## 0.5.3

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`9f9c732`](https://github.com/Axilex/AxilexGames/commit/9f9c732) add host management and redirect handling in lobby components
  - [`c3d4750`](https://github.com/Axilex/AxilexGames/commit/c3d4750) refactor PlayerList component for improved player display and status handling
  - [`12abbf8`](https://github.com/Axilex/AxilexGames/commit/12abbf8) enhance lobby functionality with improved player connection handling and start conditions
  - [`ddfd1f3`](https://github.com/Axilex/AxilexGames/commit/ddfd1f3) add sousRoundHistory to track round history and prevent duplicate words

## 0.5.2

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`9768dd7`](https://github.com/Axilex/AxilexGames/commit/9768dd7) optimize resource requests and limits in API deployment configuration

## 0.5.1

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`75e344b`](https://github.com/Axilex/AxilexGames/commit/75e344b) optimize resource requests for web deployment in Kubernetes
  - [`3fd020b`](https://github.com/Axilex/AxilexGames/commit/3fd020b) implement game color schemes for improved UI consistency and styling
  - [`e68dec1`](https://github.com/Axilex/AxilexGames/commit/e68dec1) enhance Telepathie game integration with Snap Avis and improve code formatting
  - [`442ffb2`](https://github.com/Axilex/AxilexGames/commit/442ffb2) implement ArrayRoomRegistryService and RoomTimerService for game room management

## 0.5.0

### Minor Changes

- ### ✨ Nouvelles fonctionnalités
  - [`2272978`](https://github.com/Axilex/AxilexGames/commit/2272978) add Telepathie game with lobby, game, and summary pages

## 0.4.0

### Minor Changes

- Add snap avis

## 0.3.4

### Patch Changes

- ### ✨ Nouvelles fonctionnalités
  - [`5f551b0`](https://github.com/Axilex/AxilexGames/commit/5f551b0) add ESLint configuration for TypeScript and Vue with custom rules
  - [`dc9e15d`](https://github.com/Axilex/AxilexGames/commit/dc9e15d) implement lobby reset functionality and enhance room management
  - [`885abac`](https://github.com/Axilex/AxilexGames/commit/885abac) add error code extraction utility and enhance player management in game rooms
  - [`9092329`](https://github.com/Axilex/AxilexGames/commit/9092329) refactor error handling in CommonLobbyGateway and create GameEntryPage component for improved UI
  - [`8b37f63`](https://github.com/Axilex/AxilexGames/commit/8b37f63) refactor room registry services to use MapRoomRegistryService and implement player management methods
  - [`0197fe4`](https://github.com/Axilex/AxilexGames/commit/0197fe4) implement game clearing functionality in common lobby
  - [`97a3207`](https://github.com/Axilex/AxilexGames/commit/97a3207) enhance room update handling to prevent incorrect navigation for unregistered players
  - [`0ab17b3`](https://github.com/Axilex/AxilexGames/commit/0ab17b3) implement choose challenge timer functionality in surenchere game
  - [`f31936c`](https://github.com/Axilex/AxilexGames/commit/f31936c) add settings update functionality for surenchere game
  - [`29a016b`](https://github.com/Axilex/AxilexGames/commit/29a016b) implement typing relay and timer for surenchere game

  ### ♻️ Refactoring
  - [`8e86116`](https://github.com/Axilex/AxilexGames/commit/8e86116) improve formatting of RoomWithMappedPlayers interface for better readability
  - [`2f8a994`](https://github.com/Axilex/AxilexGames/commit/2f8a994) clean up code formatting and improve readability across multiple files

  ### 🔧 Maintenance
  - [`51444e7`](https://github.com/Axilex/AxilexGames/commit/51444e7) upgrade dependencies

## 0.3.3

### Patch Changes

- ### 🐛 Corrections
  - [`199fb4e`](https://github.com/Axilex/AxilexGames/commit/199fb4e) change default value to 3 and 1

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
