import { h } from 'vue';
import { RouterView } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { requireBugMatrixRoom } from '@/router/guards/requireBugMatrixRoom';
import { requireBugMatrixGame } from '@/router/guards/requireBugMatrixGame';

export const bugMatrixRoutes: RouteRecordRaw[] = [
  {
    path: '/bug-matrix',
    component: { render: () => h(RouterView) },
    children: [
      {
        path: '',
        name: 'bug-matrix',
        component: () => import('./pages/BugMatrixPage.vue'),
      },
      {
        path: 'lobby',
        name: 'bug-matrix-lobby',
        component: () => import('./pages/BugMatrixLobbyPage.vue'),
        beforeEnter: [requireBugMatrixRoom],
      },
      {
        path: 'game',
        name: 'bug-matrix-game',
        component: () => import('./pages/BugMatrixGamePage.vue'),
        beforeEnter: [requireBugMatrixRoom, requireBugMatrixGame],
      },
      {
        path: 'summary',
        name: 'bug-matrix-summary',
        component: () => import('./pages/BugMatrixSummaryPage.vue'),
        beforeEnter: [requireBugMatrixRoom],
      },
    ],
  },
];
