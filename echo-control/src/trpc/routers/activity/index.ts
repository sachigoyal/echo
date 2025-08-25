import { createTRPCRouter } from '../../trpc';

import { appActivityRouter } from './app';
import { creatorActivityRouter } from './creator';

export const activityRouter = createTRPCRouter({
  app: appActivityRouter,
  creator: creatorActivityRouter,
});
