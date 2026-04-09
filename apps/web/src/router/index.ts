import { createRouter, createWebHistory } from 'vue-router';
import { wikiRaceRoutes } from '@/apps/wiki-race/router';

/**
 * Main application router.
 * Each game/app contributes its own route array — just import and spread it here.
 *
 * Example for a new game:
 *   import { myGameRoutes } from '@/apps/my-game/router';
 *   ...wikiRaceRoutes,
 *   ...myGameRoutes,
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    ...wikiRaceRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
});

export default router;
