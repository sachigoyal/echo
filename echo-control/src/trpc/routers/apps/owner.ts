import { createApp, createAppSchema } from '@/services/apps/owner';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  createFreeTierPaymentLink,
  createFreeTierPaymentLinkSchema,
} from '@/services/stripe';
import { getAllOwnerEchoApps } from '@/lib/apps';

export const ownerAppsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createAppSchema)
    .mutation(async ({ ctx, input }) => {
      return await createApp(ctx.session.user.id, input);
    }),

  createFreeTierPaymentLink: protectedProcedure
    .input(createFreeTierPaymentLinkSchema)
    .mutation(async ({ ctx, input }) => {
      return await createFreeTierPaymentLink(ctx.session.user.id, input);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await getAllOwnerEchoApps(ctx.session.user.id);
  }),
});
