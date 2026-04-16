import { h } from 'vue';
import { RouterView } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { requireSnapAvisRoom } from '@/router/guards/requireSnapAvisRoom';
import { requireSnapAvisGame } from '@/router/guards/requireSnapAvisGame';

export const snapAvisRoutes: RouteRecordRaw[] = [
  {
    path: '/snap-avis',
    component: { render: () => h(RouterView) },
    children: [
      {
        path: '',
        name: 'snap-avis',
        component: () => import('./pages/SnapAvisPage.vue'),
      },
      {
        path: 'lobby',
        name: 'snap-avis-lobby',
        component: () => import('./pages/LobbyPage.vue'),
        beforeEnter: [requireSnapAvisRoom],
      },
      {
        path: 'game',
        name: 'snap-avis-game',
        component: () => import('./pages/GamePage.vue'),
        beforeEnter: [requireSnapAvisRoom, requireSnapAvisGame],
      },
      {
        path: 'summary',
        name: 'snap-avis-summary',
        component: () => import('./pages/SummaryPage.vue'),
        beforeEnter: [requireSnapAvisRoom],
      },
    ],
  },
];
