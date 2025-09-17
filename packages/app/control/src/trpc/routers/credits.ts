import {
  redeemCreditReferralCode,
  redeemCreditReferralCodeSchema,
} from '@/services/credits/coupon';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import {
  getReferralCode,
  getReferralCodeSchema,
} from '@/services/credits/coupon';
import { TRPCError } from '@trpc/server';
import {
  redeemCreditGrantCode,
  redeemCreditGrantCodeSchema,
} from '@/lib/credit-grants';

export const creditsRouter = createTRPCRouter({
  grant: {
    get: publicProcedure
      .input(getReferralCodeSchema)
      .query(async ({ input }) => {
        const referralCode = await getReferralCode(input);

        if (!referralCode) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Referral code not found',
          });
        }

        return referralCode;
      }),
    redeem: protectedProcedure
      .input(redeemCreditGrantCodeSchema)
      .mutation(async ({ ctx, input }) => {
        return await redeemCreditGrantCode(ctx.session.user.id, input);
      }),
  },
});
