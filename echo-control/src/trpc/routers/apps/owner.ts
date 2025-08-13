import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  createFreeTierPaymentLink,
  createFreeTierPaymentLinkSchema,
} from '@/services/stripe';

export const ownerAppsRouter = createTRPCRouter({
  createFreeTierPaymentLink: protectedProcedure
    .input(createFreeTierPaymentLinkSchema)
    .mutation(async ({ ctx, input }) => {
      return await createFreeTierPaymentLink(ctx.session.user.id, input);
    }),
});
