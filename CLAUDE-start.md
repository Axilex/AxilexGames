# Prompt IA — WikiRace Multiplayer

Tu es un architecte fullstack senior et un développeur expérimenté en NestJS, Vue 3 et applications temps réel.

Ta mission : concevoir et implémenter une application web multijoueur inspirée de [wiki-race.com](https://wiki-race.com/game), avec une architecture propre, moderne, maintenable et pensée pour une expérience temps réel fluide.

## Stack imposée

- Monorepo : pnpm workspace
- Backend : NestJS
- Frontend : Vue 3 + Composition API
- Build frontend : Vite
- Langage : TypeScript strict
- State frontend : Pinia
- Routing frontend : Vue Router
- Communication temps réel : WebSocket / Socket.IO
- UI : Tailwind CSS
- Qualité : ESLint + Prettier
- Tests frontend : Vitest + Vue Test Utils
- Tests backend : Jest

## Scope V1

**Important :** je veux une V1 fonctionnelle sans base de données.

L'application repose principalement sur :
- un serveur NestJS
- une communication temps réel via Socket.IO
- un état mémoire côté backend pour gérer les rooms, les joueurs et les parties en cours

Tu ne dois pas introduire de base de données relationnelle ni Prisma dans cette première version.

Si une persistance minimale est utile, elle doit rester en mémoire uniquement.

## Concept du jeu

Le jeu consiste à partir d'une page Wikipedia de départ et à atteindre une page Wikipedia cible uniquement en cliquant sur les liens présents dans les pages.

Chaque joueur commence avec la **même page de départ** et doit trouver la **même page cible**.

Le jeu se joue directement dans l'application :
- on affiche le contenu de la page Wikipedia dans le site du jeu
- le joueur peut scroller
- le joueur peut cliquer sur les liens internes autorisés
- le backend vérifie la progression
- la partie s'arrête dès qu'un joueur atteint la bonne page cible

## Fonctionnalités attendues

### 1. Création et lobby
- Créer une room/lobby
- Générer un code de room simple et partageable
- Générer aussi un lien de partage/rejoindre
- Permettre à d'autres joueurs de rejoindre avec un pseudo
- Afficher la liste des joueurs connectés en temps réel
- Distinguer l'hôte de la room
- L'hôte peut lancer la partie

### 2. Lancement de partie
- Au démarrage, tous les joueurs reçoivent :
  - la même page Wikipedia de départ
  - la même page Wikipedia cible
- Le jeu démarre synchronisé pour tous les joueurs de la room
- Le timer global démarre au même moment pour tous

### 3. Gameplay
- Le joueur navigue uniquement à travers les liens internes de Wikipedia autorisés
- Le contenu Wikipedia est affiché dans l'application, pas via navigation libre hors du jeu
- Il doit être possible de scroller normalement dans la page
- Le joueur ne doit pas pouvoir tricher en entrant directement une URL arbitraire
- Chaque clic doit être tracké
- Le chemin parcouru par le joueur doit être conservé
- On doit pouvoir afficher les mots-clés/pages traversées

### 4. Suivi en temps réel
- Voir les autres joueurs dans une sidebar ou un panneau dédié
- Afficher leur avancement
- Afficher au minimum :
  - pseudo
  - statut
  - nombre de clics
  - page actuelle ou indicateur d'avancement
- La synchronisation doit être en temps réel via Socket.IO

### 5. Timer et fin de partie
- Afficher un timer global visible pendant la partie
- Dès qu'un joueur trouve la page cible, la partie s'arrête immédiatement pour tout le monde
- Afficher ensuite un résumé de partie
- Le résumé doit contenir :
  - le vainqueur
  - le temps total
  - le chemin cliqué par le vainqueur
  - le chemin des autres joueurs si disponible
  - les pages / mots-clés traversés

### 6. Surrender
- Ajouter un bouton **Surrender**
- Si un joueur ne trouve pas la page ou se retrouve bloqué, il peut abandonner
- Le joueur abandonné passe dans un statut dédié
- Son abandon n'arrête pas la partie tant qu'un autre joueur joue encore
- Si tous les joueurs abandonnent, la partie se termine sans vainqueur

## Contraintes produit

- Pas de base de données en V1
- Pas d'auth complexe
- Pas de compte utilisateur
- Un pseudo suffit pour rejoindre une room
- Le code room doit être simple à partager
- L'UX doit être claire, rapide et orientée jeu multijoueur
- Responsive desktop d'abord, mais mobile/tablette doit rester exploitable

## Contraintes techniques importantes

### Backend
- NestJS doit gérer la logique de room et de partie en mémoire
- Utiliser WebSocket Gateway avec Socket.IO
- Les rooms, players, games et états de partie sont stockés en mémoire dans des services dédiés
- Séparer clairement :
  - logique de lobby
  - logique de partie
  - logique d'intégration Wikipedia
  - logique de synchronisation temps réel
- Le backend doit être source de vérité de l'état du jeu
- Le backend valide les actions des joueurs
- Ne jamais faire confiance au frontend pour la validité de la progression

### Frontend
- Vue 3 + Composition API + TypeScript strict
- Pinia pour l'état UI et session locale
- Vue Router pour les écrans
- Les composants doivent rester découplés de la logique métier lourde
- La communication Socket.IO doit passer par un service/composable dédié
- Le frontend ne doit pas contenir la logique métier critique de validation de victoire

### Wikipedia
- Le joueur ne doit pas naviguer librement sur wikipedia.org
- Le backend doit récupérer et préparer le contenu nécessaire
- Le frontend affiche une version intégrée/sécurisée de la page
- Il faut filtrer les liens autorisés
- Les liens externes, actions non prévues et navigations hors scope doivent être bloqués
- Il faut prévoir une abstraction propre pour la récupération et la transformation des pages Wikipedia

## Architecture attendue

Je veux un **monorepo pnpm** avec deux applications :
- `apps/web` pour le frontend Vue
- `apps/api` pour le backend NestJS

Je veux aussi une organisation propre avec packages partagés si utile, par exemple pour les types :
- `packages/shared`

Structure recommandée :

```txt
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── modules/
│   │   │   │   ├── lobby/
│   │   │   │   ├── game/
│   │   │   │   ├── wikipedia/
│   │   │   │   └── health/
│   │   │   ├── gateways/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── dto/
│   │   │   ├── types/
│   │   │   └── main.ts
│   │   └── test/
│   │
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── router/
│       │   │   └── providers/
│       │   ├── assets/
│       │   ├── components/
│       │   │   ├── lobby/
│       │   │   ├── game/
│       │   │   ├── summary/
│       │   │   └── ui/
│       │   ├── composables/
│       │   ├── pages/
│       │   ├── services/
│       │   ├── stores/
│       │   ├── types/
│       │   └── main.ts
│       └── public/
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── contracts/
│       │   ├── events/
│       │   ├── types/
│       │   └── utils/
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
└── CLAUDE.md
```

## Pages attendues

### 1. Home
- Créer une room
- Rejoindre une room avec code + pseudo
- UX simple et immédiate

### 2. Lobby
- Affichage du code room
- Lien de partage
- Liste des joueurs connectés
- Indication du host
- Bouton lancer la partie
- Statut des joueurs en temps réel

### 3. Game
- Zone principale avec affichage de la page Wikipedia intégrée
- Timer global visible
- Page cible visible en permanence
- Bouton surrender
- Sidebar joueurs / progression
- Historique des pages cliquées pour le joueur courant

### 4. Summary
- Vainqueur
- Temps final
- Classement éventuel
- Chemin parcouru par les joueurs
- Pages cliquées / mots-clés trouvés
- Option rejouer dans la même room ou revenir à l'accueil

## Stores / services attendus

### Frontend
Stores clairs :
- `useSessionStore`
- `useLobbyStore`
- `useGameStore`
- `useSocketStore`

Services / composables possibles :
- `socket.service.ts`
- `lobby.service.ts`
- `game.service.ts`
- `wikipedia.service.ts`
- `useSocket.ts`
- `useLobby.ts`
- `useGameSession.ts`

### Backend
Services clairs :
- `LobbyService`
- `GameService`
- `RoomRegistryService`
- `WikipediaService`
- `GameStateService`
- `PlayerSessionService`

Le but est d'avoir une architecture où la logique métier est centralisée dans des services testables.

## Événements temps réel attendus

Prévois une modélisation claire des événements Socket.IO.

Exemples d'événements :
- `room:create`
- `room:join`
- `room:leave`
- `room:update`
- `game:start`
- `game:state`
- `game:navigate`
- `game:surrender`
- `game:finished`
- `player:progress`
- `player:disconnected`
- `player:reconnected`

Je veux que les payloads soient typés proprement.

## Modèle métier attendu

Prévois des modèles/types clairs pour :
- Room
- Player
- GameSession
- GameStatus
- PlayerStatus
- NavigationStep
- GameSummary
- WikipediaPage

Exemples de besoins métier :
- Une room a un code, un host, une liste de joueurs, un état
- Un joueur a un id socket, un pseudo, un statut, un historique de navigation
- Une partie connaît la page de départ, la page cible, l'heure de début, l'heure de fin, le vainqueur éventuel
- Chaque navigation ajoute une entrée dans l'historique du joueur

## UX attendue

- Interface moderne, sobre, lisible
- Focus fort sur la lisibilité des pages et de la cible à atteindre
- États temps réel très compréhensibles
- Feedback immédiat sur connexion, attente, départ, victoire, abandon
- Timer visible mais non agressif
- Expérience fluide même si plusieurs joueurs naviguent en parallèle

## Design system

- Palette moderne et simple
- Typographie lisible
- Layout propre type app SaaS / jeu web léger
- Sidebar claire pour les joueurs
- États visuels distincts : waiting, playing, surrendered, winner, disconnected
- Responsive et accessible

## Contraintes de code

- Code propre et professionnel
- TypeScript strict partout
- Séparation nette UI / logique métier / infrastructure
- Composants réutilisables
- Pas de logique Socket dispersée partout dans le frontend
- Pas de singleton brouillon non maîtrisé
- Pas de logique métier importante directement dans les composants Vue
- Pas d'architecture sur-ingenierée
- Pas de dépendance inutile

## Priorités

1. Architecture monorepo propre
2. Temps réel robuste via Socket.IO
3. Expérience de jeu fluide
4. Code maintenable et bien typé
5. Intégration Wikipedia propre et sécurisée
6. Simplicité de la V1 sans base de données

## Ce qu'il ne faut pas faire

- Ne pas ajouter de base de données en V1
- Ne pas introduire Prisma ou ORM inutile
- Ne pas construire une auth complexe
- Ne pas mélanger la logique de room et la logique de rendu UI
- Ne pas faire confiance au frontend pour l'état réel du jeu
- Ne pas permettre de navigation libre hors des liens autorisés
- Ne pas faire un prototype jetable sans structure
- Ne pas créer une architecture microservices inutile pour cette V1

## Sortie attendue

Réponds dans cet ordre :
1. Vision produit résumée
2. Architecture recommandée du monorepo
3. Arborescence du projet
4. Modèle métier et types principaux
5. Événements Socket.IO et contrats
6. Stores, services et responsabilités
7. Parcours utilisateur complet
8. Pages et composants à créer
9. Gestion de l'état en mémoire côté backend
10. Intégration et sécurisation des pages Wikipedia
11. Plan d'implémentation V1 par étapes
12. Points de vigilance techniques
13. Évolutions possibles V2

Quand tu proposes du code :
- utilise NestJS côté backend
- utilise Vue 3 + Composition API côté frontend
- utilise TypeScript strict
- favorise la maintenabilité
- commente peu mais utilement
- propose un code modulaire, lisible et testable
- donne la structure avant les fichiers détaillés
