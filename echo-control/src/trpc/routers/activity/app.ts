import { getAppActivity, getAppActivitySchema } from '@/services/activity/app';

import { createTRPCRouter, protectedProcedure } from '../../trpc';

export const appActivityRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getAppActivitySchema)
    .query(async ({ input }) => {
      return getAppActivity(input);
    }),
});
