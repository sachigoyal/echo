import { createCallerFactory, createTRPCRouter } from '../trpc';

import { appsRouter } from './apps';
import { userRouter } from './user';
import { adminRouter } from './admin';
import { activityRouter } from './activity';

export const appRouter = createTRPCRouter({
  apps: appsRouter,
  user: userRouter,
  activity: activityRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

// Create server-side caller
export const createServerCaller = createCallerFactory(appRouter);
