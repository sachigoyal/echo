import { createCallerFactory, createTRPCRouter } from '../trpc';

import { adminRouter } from './admin/admin';
import { appsRouter } from './apps';
import { creditsRouter } from './credits';
import { githubRouter } from './github';
import { uploadRouter } from './upload';
import { userRouter } from './user';

export const appRouter = createTRPCRouter({
  apps: appsRouter,
  user: userRouter,
  credits: creditsRouter,
  admin: adminRouter,
  upload: uploadRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
