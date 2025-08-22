import {
  getAppActivity,
  getAppActivitySchema,
} from '@/services/activity/app/app';

import { createTRPCRouter, protectedProcedure } from '../../../trpc';
import { appUsersRouter } from './users';
import { appTransactionsRouter } from './transactions';

export const appActivityRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getAppActivitySchema)
    .query(async ({ input }) => {
      return getAppActivity(input);
    }),

  users: appUsersRouter,
  transactions: appTransactionsRouter,
});
