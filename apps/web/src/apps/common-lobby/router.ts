import { h } from 'vue';
import { RouterView } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { requireCommonRoom } from '@/router/guards/requireCommonRoom';

export const commonLobbyRoutes: RouteRecordRaw[] = [
  {
    path: '/lobby',
    component: { render: () => h(RouterView) },
    children: [
      {
        path: ':code',
        name: 'common-lobby',
        component: () => import('./pages/LobbyCommonPage.vue'),
        beforeEnter: [requireCommonRoom],
      },
    ],
  },
];
