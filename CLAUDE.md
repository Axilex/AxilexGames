# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A personal web hub hosting multiple projects. Currently hosts **WikiRace Multiplayer** — a game where players race to navigate Wikipedia (French) from a start article to a target article using only internal links. See `CLAUDE-start.md` for the full WikiRace product specification.

## Status

All 7 phases + game modes implemented and passing:
- 120 tests green (86 backend Jest + 34 frontend Vitest)
- `pnpm lint` clean (0 errors, 0 warnings)
- `pnpm build` succeeds across all packages

**Post-phase additions:**
- Host can search and select start/end Wikipedia articles by title (REST `GET /wiki/search?q=`)
- Wikipedia pages render with images, figures, and infoboxes (sanitizer allows `img`/`figure`/`figcaption` from Wikimedia origins only)
- Portal home page (`/`) rebranded as **AxilexGames** — a gaming hub with a game card grid; WikiRace join/create at `/wikirace`
- Frontend restructured into `shared/` + `apps/wiki-race/` architecture (see below)
- Design system: warm stone + amber palette replacing cold gray + blue
- `DisconnectOverlay` shows only after first connection (uses `hasConnectedOnce` flag)
- Copy-to-clipboard for navigation path in game and summary
- `WikipediaController` added alongside the Socket.IO gateway for the search REST endpoint
- `"type": "module"` added to `apps/web/package.json` (eliminates `MODULE_TYPELESS_PACKAGE_JSON` warning)
- URL-encoded slugs decoded with `decodeURIComponent` everywhere they are displayed (target, history, sidebar, summary)
- Ctrl+F / Cmd+F blocked during the game (`WikiContentArea` intercepts `keydown` on `document`) with a toast notification
- WikiRace routes nested under `/wikirace/` — all navigations use named routes (`{ name: 'lobby' }` etc.) so the prefix is changed only in `router.ts`
- Reconnection after network drop requires a manual button click (no auto-rejoin) — `useReconnection` sets `pendingRejoin` in `useSocketStore`; `DisconnectOverlay` shows the button
- `room:reset` event resets room to `WAITING` (host triggered from summary "Rejouer") — resets player statuses, clears history and `game` field
- Win detection and slug comparison fully normalized via `normalizeSlug` (`decodeURIComponent`) on all incoming slugs before storage, cache lookup, and comparison
- **5 game modes**: CLASSIC, SPRINT, LABYRINTH, DRIFT, BINGO — chooser selects mode + config during CHOOSING phase; ranked summaries for DRIFT and BINGO

## Stack

- **Monorepo**: pnpm workspace
- **Backend** (`apps/api`): NestJS + Socket.IO + TypeScript strict, no database (in-memory state only)
- **Frontend** (`apps/web`): Vue 3 + Composition API + Vite + Pinia + Vue Router + Tailwind CSS
- **Shared types** (`packages/shared`): contracts, Socket.IO event types, domain models
- **Testing**: Jest (backend), Vitest + Vue Test Utils (frontend)
- **Wikipedia**: French (`fr.wikipedia.org`), REST API v1, Parsoid HTML

## Commands

```bash
# Install all dependencies
pnpm install

# Run both apps in dev mode (from root) — web on :5173, api on :3000
pnpm dev

# Run individual apps
pnpm --filter api dev
pnpm --filter web dev

# Build
pnpm build
pnpm --filter api build
pnpm --filter web build

# Tests
pnpm test                                              # all
pnpm --filter api test                                 # backend (Jest)
pnpm --filter api test -- --testPathPattern=lobby      # single file
pnpm --filter web test                                 # frontend (Vitest)
pnpm --filter web test -- lobby.spec.ts                # single file

# Lint + format
pnpm lint
pnpm format
```

## Architecture

### Backend (`apps/api/src/`)

NestJS modules with strict separation:

- **`modules/lobby/`** — room creation, join, leave, host transfer, reconnect. Owns `LobbyService` and `RoomRegistryService`.
- **`modules/game/`** — game lifecycle, navigation validation, win condition, surrender, timer, mode logic. Owns `GameService`, `GameStateService`, and `ModeService`.
- **`modules/wikipedia/`** — fetches French Wikipedia pages, sanitizes HTML, LRU cache (500 pages, 10min TTL). Owns `WikipediaService`, `WikipediaController` (REST search), and `sanitizer.ts`.
- **`gateways/`** — Socket.IO `GameGateway`, thin orchestrator, no business logic. Uses `WsExceptionFilter` and `WsLoggingInterceptor`.
- **`interceptors/`** — `WsLoggingInterceptor` logs all gateway events.
- **`filters/`** — `WsExceptionFilter` catches unhandled gateway exceptions.

**Key rules:**
- Backend is the sole source of truth — validates every navigation, decides when games end
- All state is in-memory (Maps keyed by room code / socket ID). No database, no Prisma
- Rate limit: 500ms minimum between navigations per player
- Reconnect: 30s grace period before a disconnected player is purged
- `game:navigate` sends the new Wikipedia page only to the navigating player via `game:page`

### Frontend (`apps/web/src/`)

The frontend is organized as a **portal** with a shared layer and per-app modules:

```
src/
  App.vue                          — mounts router-view + DisconnectOverlay; connects socket
  pages/
    HomePage.vue                   — portal landing page (route: /)
  shared/                          — shared across all future apps/games
    components/ui/                 — BaseButton, BaseInput, AppNav, GameCard, LoadingSpinner, ErrorToast, DisconnectOverlay
    composables/useSocket.ts
    services/socket.service.ts     — single Socket.IO instance (only file importing socket.io-client)
    stores/
      useSessionStore.ts           — pseudo + roomCode, persisted in sessionStorage
      useSocketStore.ts            — isConnected, hasConnectedOnce
  apps/
    wiki-race/                     — self-contained WikiRace module
      components/game/             — WikiContentArea, GameTimer, PlayerSidebar, NavigationHistory, SurrenderButton, BingoCard, DriftScoreDisplay
      components/lobby/            — PlayerList, RoomCodeDisplay, ShareLink, TimeLimitSelector, WikiPageSearch, ModeSelector, ClickLimitSelector, DriftObjectiveSelector, BingoConstraintPicker
      components/summary/          — WinnerBanner, PlayerPathDisplay, DriftLeaderboard, BingoBoardSummary
      composables/                 — useLobby, useGameSession, useReconnection, useSocketListeners
      pages/                       — WikiRacePage (/wikirace), LobbyPage, GamePage, SummaryPage
      services/                    — game.service.ts, lobby.service.ts
      stores/                      — useGameStore (includes localHistory: NavigationStep[]), useLobbyStore
      router.ts                    — exports wikiRaceRoutes[] nested under /wikirace/ (layout: h(RouterView)), spread into src/router/index.ts
  router/
    index.ts                       — imports and spreads wikiRaceRoutes; add new apps here
    guards/requireRoom.ts          — redirects to { name: 'wikirace' } if no roomCode in session
    guards/requireGame.ts          — redirects to { name: 'lobby' } if game not in progress
```

**Adding a new game/app:**
1. Create `src/apps/<name>/` with pages, stores, composables, services, components
2. Create `src/apps/<name>/router.ts` exporting a `RouteRecordRaw[]`
3. Import and spread those routes in `src/router/index.ts`
4. Add a card on `src/pages/HomePage.vue`

**Path aliases** (available everywhere in `apps/web`):
- `@/` → `src/` (e.g. `@/shared/stores/useSessionStore`)
- `@wiki-race/shared` → compiled shared package types

**Key rules:**
- No Socket.IO calls in components — all socket communication goes through `socket.service.ts` and composables
- `useSocketListeners` is registered once in `App.vue` to avoid duplicate handlers
- `DisconnectOverlay` (in `App.vue`) blocks the UI with a reconnection screen when the socket drops — only shown after `hasConnectedOnce` is true to avoid false positives at startup
- `socketService.connect()` must be called before `useSocketListeners()` in `App.vue` setup so the socket object exists when `on()` calls are made
- `useReconnection` uses a local `hasDisconnected` flag to distinguish first connection from reconnection — on reconnect sets `socketStore.pendingRejoin = true` instead of auto-rejoining; `doRejoin()` is called manually via the `DisconnectOverlay` button
- `useSocketListeners` clears session and redirects to `{ name: 'wikirace' }` on `ROOM_NOT_FOUND` or `GAME_NOT_IN_PROGRESS` errors (stale session cleanup)
- All internal navigations use named routes (`{ name: 'lobby' }`, `{ name: 'game' }`, etc.) — never hardcoded paths
- `WikiContentArea` uses event delegation (`closest('a[href^="/wiki/"]')`) — never `v-on` on dynamic links
- `WikiContentArea` intercepts `Ctrl+F`/`Cmd+F` via a `document` keydown listener (mounted/unmounted with the component) to block browser search during the game
- All slug strings are decoded with `decodeURIComponent` before display — never show raw URL-encoded characters to the player
- Local navigation history is tracked in `useGameStore.setCurrentPage()` (backend only sends pages to the navigating player)

### Branding

The site is named **AxilexGames** — a gaming hub. `AppNav` shows the logo (amber gradient icon + `Axilex` + `Games` in amber). `GameCard` is the shared component for the home page game grid: accepts `name`, `description`, `tags`, `gradient`, `icon`, `to`, `live`, `players` props. Adding a new game = add an entry to the `games` array in `HomePage.vue` and create its route.

### Design system

Warm minimalist palette — **stone** neutrals + **amber** accent:
- Backgrounds: `bg-stone-50` (pages), `bg-white` (cards)
- Borders: `border-stone-200`
- Text: `text-stone-900` / `text-stone-500` / `text-stone-400`
- Primary action: `bg-amber-600 hover:bg-amber-700` (replaces blue everywhere)
- Focus rings: `focus:ring-amber-500`
- Active nav tab: `bg-amber-50 text-amber-700`
- "You" highlight in game sidebar: `bg-amber-50 border-amber-200`
- Wikipedia link color stays `#3366cc` (Wikipedia standard, intentional)
- Wikipedia content font: Linux Libertine / Georgia / serif (Wikipedia-like)

### Shared (`packages/shared/src/`)

- **`domain/`** — `enums.ts` (`GameStatus`, `PlayerStatus`, `GameMode`, `DriftObjective`), `bingo.types.ts` (`BingoConstraintId`, `BINGO_CONSTRAINTS`, `BingoCardEntry`), domain interfaces (`Room`, `Player`, `WikipediaPage`, `NavigationStep`, `GameSummary`)
- **`dto/`** — wire-safe DTOs (`RoomDTO`, `PlayerDTO`, `GameStateDTO`, `PlayerProgressDTO`); all extended with mode-specific fields (`clicksLeft`, `driftBestScore`, `bingoValidated`, etc.)
- **`events/`** — typed Socket.IO maps (`ClientToServerEvents`, `ServerToClientEvents`)

### Game modes

The mode is selected by the **chooser** during the CHOOSING phase alongside start/target articles. `GameConfirmChoicesPayload` carries `mode`, `clickLimit`, `driftObjective`, `bingoConstraintIds`.

| Mode | Win condition | Key config |
|---|---|---|
| CLASSIC | First to reach target | Optional time limit |
| SPRINT | First to reach target | Mandatory time limit |
| LABYRINTH | First to reach target | Click limit (4–6); no clicks left = eliminated |
| DRIFT | Best metric score when clicks exhausted | `DriftObjective` (oldest year in slug / shortest / most images); click limit |
| BINGO | First to validate all selected constraints | `BingoConstraintId[]` (4–6 from 10 predefined); click limit |

**`ModeService`** (backend, injectable, pure logic):
- `computeDriftScore(objective, html, slug)` — OLDEST: regex `/\b\d{4}\b/` on decoded slug title; SHORTEST: strip HTML then word count; MOST_IMAGES: count `<img` tags
- `checkConstraints(ids, slug, html)` — returns which constraint IDs are validated by a given page (10 regex-based checks)
- `allPlayersFinished(room)` — true when every player's status is not CONNECTED (used to trigger ranked end in DRIFT/BINGO)
- `rankDriftPlayers(players, objective)` — sorts by `driftBestScore` (null last), tie-break by hop count

**Navigation flow per mode:**
- CLASSIC/SPRINT: first player to reach `targetSlug` → `endGame(socketId)`, instant winner
- LABYRINTH: reaching `targetSlug` wins; exhausting click limit eliminates; `allPlayersFinished` → `endGame(null)`
- DRIFT: each navigation updates `driftBestScore`/`driftBestSlug`; when click limit reached → `FINISHED`; `allPlayersFinished` → ranked `buildSummary`
- BINGO: each navigation runs `checkConstraints`; new validated constraints emitted via `bingo:validated` (unicast); validating all → instant win; click limit exhausted → ranked end

**`targetSlug` is nullable** — `null` for DRIFT and BINGO (no destination). All downstream code handles `string | null`.

### Socket.IO events

| Event | Direction | Description |
|---|---|---|
| `room:create` | C→S | Create room with pseudo |
| `room:join` | C→S | Join room (also used for reconnect) |
| `room:leave` | C→S | Leave room |
| `room:update` | S→C | Broadcast updated room state |
| `room:reset` | C→S | Host resets room to WAITING after game ends |
| `game:start` | C→S | Host triggers game start |
| `game:state` | S→C | Full game state broadcast |
| `game:navigate` | C→S | Player clicks a Wikipedia link |
| `game:page` | S→C | New Wikipedia page sent to navigating player only |
| `player:progress` | S→C | Broadcast player progress update |
| `game:surrender` | C→S | Player surrenders |
| `game:finished` | S→C | Game over with summary |
| `navigation:error` | S→C | Invalid navigation feedback |
| `player:disconnected` | S→C | Player lost connection |
| `player:reconnected` | S→C | Player reconnected |
| `bingo:validated` | S→C | Unicast to navigating player — newly validated Bingo constraint IDs |

## Key constraints

- No database — all state lives in NestJS services (Maps/objects in memory)
- Wikipedia content is fetched server-side from `fr.wikipedia.org`, HTML is sanitized before sending to the frontend:
  - Allowed tags include `img`, `figure`, `figcaption` (for images/infoboxes)
  - `img` src must be from `https://upload.wikimedia.org/` — all other image sources are stripped
  - Namespace links (`/wiki/Spécial:`, `/wiki/Catégorie:`, etc.) are stripped; only `/wiki/` article links are kept
  - `class` and `style` attributes are allowed on table/div/span elements (needed for infobox rendering)
- Wikipedia article search uses the OpenSearch API (`fr.wikipedia.org/w/api.php?action=opensearch`) — requires a `User-Agent` header, otherwise returns 403
- `tsc` is `noEmit: true` on the frontend — Vite handles bundling, tsc is type-check only
- Never run `tsc` directly in `apps/web` or `packages/shared` without `--noEmit`, it will emit build files into `src/`
- `apps/api/tsconfig.json` points `@wiki-race/shared` to `packages/shared/dist` (not `src`) and has `rootDir: "src"`. Without `rootDir`, tsc picks the monorepo root as the common root and outputs to `dist/apps/api/src/main.js` instead of `dist/main.js`, breaking `nest start`.
- **Shared must be built before starting the API.** `pnpm dev` handles this automatically. If you modify `packages/shared`, run `pnpm --filter shared build` before restarting the API.
- `apps/web/package.json` has `"type": "module"` — required to silence the `MODULE_TYPELESS_PACKAGE_JSON` Node warning from `postcss.config.js`.
