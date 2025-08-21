import { createCallerFactory, createTRPCRouter } from '../trpc';

import { appsRouter } from './apps';
import { userRouter } from './user';
import { adminRouter } from './admin';
import { activityRouter } from './activity';
import { uploadRouter } from './upload';

export const appRouter = createTRPCRouter({
  apps: appsRouter,
  user: userRouter,
  activity: activityRouter,
  admin: adminRouter,
  upload: uploadRouter,
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
