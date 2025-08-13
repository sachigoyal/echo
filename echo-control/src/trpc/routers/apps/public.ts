import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import {
  getAppOwner,
  getPublicApp,
  getPublicAppSchema,
  listPublicApps,
} from '@/services/apps/public';
import { extendedInfiniteQueryPaginationParamsSchema } from '@/trpc/lib/infinite-query';

export const publicAppsRouter = createTRPCRouter({
  get: publicProcedure.input(getPublicAppSchema).query(async ({ input }) => {
    const app = await getPublicApp(input);
    if (!app) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'App not found',
      });
    }

    return app;
  }),

  list: publicProcedure
    .input(
      extendedInfiniteQueryPaginationParamsSchema({
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await listPublicApps(input);
    }),

  owner: publicProcedure.input(getPublicAppSchema).query(async ({ input }) => {
    const owner = await getAppOwner(input);
    if (!owner) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Owner not found',
      });
    }
    return owner;
  }),
});
