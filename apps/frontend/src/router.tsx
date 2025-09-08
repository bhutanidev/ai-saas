// src/router.tsx
import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import api, { authApi } from './api/api';

// Import components (we'll create these next)
import RootLayout from './components/layouts/RootLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SpacePage from './pages/SpacePage';

// Auth check function
const checkAuth = async (): Promise<boolean> => {
  try {
    // You can implement a proper auth check here
    // For now, we'll check if there's a token cookie
    await authApi.checkAuth()
    return true
  } catch {
    return false;
  }
};

// Root route
const rootRoute = createRootRoute({
  component: RootLayout,
});

// Landing page route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: async () => {
    // Redirect to space if already authenticated
    const isAuth = await checkAuth();
    if (isAuth) {
      throw redirect({ to: '/space' });
    }
  },
});

// Protected space route
const spaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/space',
  component: SpacePage,
  beforeLoad: async () => {
    // Redirect to login if not authenticated
    const isAuth = await checkAuth();
    if (!isAuth) {
      throw redirect({ to: '/login' });
    }
  },
});

// Create route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  spaceRoute,
]);

// Create router
export const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}