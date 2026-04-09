import { h } from 'vue';
import { RouterView } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { requireRoom } from '@/router/guards/requireRoom';
import { requireGame } from '@/router/guards/requireGame';

/**
 * WikiRace routes — all nested under /wikirace.
 * To add a new game, create apps/<game-name>/router.ts and import it in src/router/index.ts.
 */
export const wikiRaceRoutes: RouteRecordRaw[] = [
  {
    path: '/wikirace',
    component: { render: () => h(RouterView) },
    children: [
      {
        path: '',
        name: 'wikirace',
        component: () => import('./pages/WikiRacePage.vue'),
      },
      {
        path: 'lobby',
        name: 'lobby',
        component: () => import('./pages/LobbyPage.vue'),
        beforeEnter: [requireRoom],
      },
      {
        path: 'game',
        name: 'game',
        component: () => import('./pages/GamePage.vue'),
        beforeEnter: [requireRoom, requireGame],
      },
      {
        path: 'summary',
        name: 'summary',
        component: () => import('./pages/SummaryPage.vue'),
        beforeEnter: [requireRoom],
      },
    ],
  },
];
