import {
  redeemCreditGrantCode,
  redeemCreditGrantCodeSchema,
} from '@/lib/credit-grants';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const creditsRouter = createTRPCRouter({
  creditGrantCode: {
    redeem: protectedProcedure
      .input(redeemCreditGrantCodeSchema)
      .mutation(async ({ ctx, input }) => {
        return await redeemCreditGrantCode(ctx.session.user.id, input);
      }),
  },
});
