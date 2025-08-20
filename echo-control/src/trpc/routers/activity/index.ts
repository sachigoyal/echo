import { createTRPCRouter } from '../../trpc';

import { appActivityRouter } from './app';

export const activityRouter = createTRPCRouter({
  app: appActivityRouter,
});
