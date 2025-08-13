import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../../trpc';

import { getAppMembership, listMemberApps } from '@/services/apps/member';
import { paginationParamsSchema } from '@/lib/pagination';
import { infiniteQueryPaginationParamsSchema } from '@/trpc/lib/infinite-query';

export const memberAppsRouter = createTRPCRouter({
  get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await getAppMembership(ctx.session.user.id, input);
  }),

  list: protectedProcedure
    .input(infiniteQueryPaginationParamsSchema)
    .query(async ({ ctx, input }) => {
      return await listMemberApps(ctx.session.user.id, input);
    }),
});
