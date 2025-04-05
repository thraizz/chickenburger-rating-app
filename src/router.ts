import { auth } from '@/firebase.ts';
import { setupLayouts } from 'virtual:generated-layouts';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';

// This will automatically generate the routes from the src/pages directory.
// All new pages should be added to the src/pages directory.
const router = createRouter({
  history: createWebHistory(),
  routes: setupLayouts(routes),
});

const protectedRoutes: string[] = [];
router.beforeEach(async (to, from, next) => {
  try {
    // Wait for Firebase auth to initialize
    await auth.authStateReady();

    // Check for protected routes
    if (to.meta.requiresAuth || protectedRoutes.includes(to.path)) {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        // Redirect to home with redirect param if not authenticated
        return next({
          path: '/login',
          query: { redirect: to.fullPath },
        });
      }
    }

    // Catch all 404s
    if (to.matched.length === 0) {
      return next({
        path: '/',
        query: { redirect: to.fullPath },
      });
    }

    // Continue with the navigation
    return next();
  }
  catch (error) {
    console.error('Navigation guard error:', error);
    return next({
      path: '/',
      query: { redirect: to.fullPath },
    });
  }
});

export default router;
