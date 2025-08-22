import { getAppActivity, getAppActivitySchema } from '@/services/activity/app';

import { createTRPCRouter, protectedProcedure } from '../../../trpc';
import { appUsersRouter } from './users';

export const appActivityRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getAppActivitySchema)
    .query(async ({ input }) => {
      return getAppActivity(input);
    }),

  users: appUsersRouter,
});
