import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../../trpc';

import { getAppMembership, listApps } from '@/services/apps/member';
import { paginationParamsSchema } from '@/lib/pagination';

export const memberAppsRouter = createTRPCRouter({
  get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await getAppMembership(ctx.session.user.id, input);
  }),

  list: protectedProcedure
    .input(paginationParamsSchema)
    .query(async ({ ctx, input }) => {
      return await listApps(ctx.session.user.id, input);
    }),
});
