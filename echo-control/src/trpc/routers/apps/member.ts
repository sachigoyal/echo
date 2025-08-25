import { z } from 'zod';

import {
  createTRPCRouter,
  paginatedProcedure,
  protectedProcedure,
} from '../../trpc';

import {
  getAppMembership,
  joinApp,
  listMemberApps,
} from '@/services/apps/member';

import { TRPCError } from '@trpc/server';
import { getPublicApp } from '@/services/apps/public';

export const memberAppsRouter = createTRPCRouter({
  get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await getAppMembership(ctx.session.user.id, input);
  }),

  list: paginatedProcedure.concat(protectedProcedure).query(async ({ ctx }) => {
    return await listMemberApps(ctx.session.user.id, ctx.pagination);
  }),

  join: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const app = await getPublicApp(input);

      if (!app) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'App not found',
        });
      }

      return await joinApp(ctx.session.user.id, app.id).catch(() => {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already a member of this app',
        });
      });
    }),
});
