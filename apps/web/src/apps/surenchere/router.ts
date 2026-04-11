import { h } from 'vue';
import { RouterView } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { requireSurenchereRoom } from '@/router/guards/requireSurenchereRoom';
import { requireSurenchereGame } from '@/router/guards/requireSurenchereGame';

export const surenchereRoutes: RouteRecordRaw[] = [
  {
    path: '/surenchere',
    component: { render: () => h(RouterView) },
    children: [
      {
        path: '',
        name: 'surenchere',
        component: () => import('./pages/SurencherePage.vue'),
      },
      {
        path: 'lobby',
        name: 'surenchere-lobby',
        component: () => import('./pages/LobbyPage.vue'),
        beforeEnter: [requireSurenchereRoom],
      },
      {
        path: 'game',
        name: 'surenchere-game',
        component: () => import('./pages/GamePage.vue'),
        beforeEnter: [requireSurenchereRoom, requireSurenchereGame],
      },
      {
        path: 'summary',
        name: 'surenchere-summary',
        component: () => import('./pages/SummaryPage.vue'),
        beforeEnter: [requireSurenchereRoom],
      },
    ],
  },
];
