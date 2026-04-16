import { h } from 'vue';
import { RouterView } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { requireTelepathieRoom } from '@/router/guards/requireTelepathieRoom';
import { requireTelepathieGame } from '@/router/guards/requireTelepathieGame';

export const telepathieRoutes: RouteRecordRaw[] = [
  {
    path: '/telepathie',
    component: { render: () => h(RouterView) },
    children: [
      {
        path: '',
        name: 'telepathie',
        component: () => import('./pages/TelepathiePage.vue'),
      },
      {
        path: 'lobby',
        name: 'telepathie-lobby',
        component: () => import('./pages/LobbyPage.vue'),
        beforeEnter: [requireTelepathieRoom],
      },
      {
        path: 'game',
        name: 'telepathie-game',
        component: () => import('./pages/GamePage.vue'),
        beforeEnter: [requireTelepathieRoom, requireTelepathieGame],
      },
      {
        path: 'summary',
        name: 'telepathie-summary',
        component: () => import('./pages/SummaryPage.vue'),
        beforeEnter: [requireTelepathieRoom],
      },
    ],
  },
];
