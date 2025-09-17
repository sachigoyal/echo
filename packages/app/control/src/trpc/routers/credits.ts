import {
  redeemCreditReferralCode,
  redeemCreditReferralCodeSchema,
} from '@/lib/referral-codes/credit-grants';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const creditsRouter = createTRPCRouter({
  referralCode: {
    redeem: protectedProcedure
      .input(redeemCreditReferralCodeSchema)
      .mutation(async ({ ctx, input }) => {
        return await redeemCreditReferralCode(ctx.session.user.id, input);
      }),
  },
});
