import { createTRPCRouter } from '../trpc';
import { appsRouter } from './apps';

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  apps: appsRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
