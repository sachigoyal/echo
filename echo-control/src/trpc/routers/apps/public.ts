import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import {
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

  /**
   * Get all public apps with pagination
   */
  list: publicProcedure
    .input(
      extendedInfiniteQueryPaginationParamsSchema({
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await listPublicApps(input);
    }),
});
