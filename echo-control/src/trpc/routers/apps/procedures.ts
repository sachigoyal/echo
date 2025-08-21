import { getAppOwner, getPublicApp } from '@/services/apps/public';
import { protectedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export const appProcedure = protectedProcedure
  .input(z.object({ appId: z.string() }))
  .use(async ({ next, input: { appId } }) => {
    const app = await getPublicApp(appId);
    if (!app) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    return next({ ctx: { app } });
  });

export const appOwnerProcedure = appProcedure.use(async ({ ctx, next }) => {
  const appOwner = await getAppOwner(ctx.app.id);
  if (!appOwner) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  if (appOwner.id !== ctx.session.user.id) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx: { appOwner } });
});
