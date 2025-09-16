import { createCallerFactory, createTRPCRouter } from '../trpc';

import { appsRouter } from './apps';
import { userRouter } from './user';
import { adminRouter } from './admin';
import { activityRouter } from './activity';
import { uploadRouter } from './upload';
import { creditsRouter } from './credits';

export const appRouter = createTRPCRouter({
  apps: appsRouter,
  user: userRouter,
  activity: activityRouter,
  credits: creditsRouter,
  admin: adminRouter,
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
