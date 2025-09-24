import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

import { TRPCError } from '@trpc/server';
import {
  getCreditGrantCode,
  creditGrantCodeSchema,
  getCreditGrantCodeWithUsages,
  redeemCreditGrantCode,
  redeemCreditGrantCodeSchema,
} from '@/services/db/credits/grant';

export const creditsRouter = createTRPCRouter({
  grant: {
    get: publicProcedure
      .input(creditGrantCodeSchema)
      .query(async ({ input }) => {
        const referralCode = await getCreditGrantCode(input);

        if (!referralCode) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Referral code not found',
          });
        }

        return referralCode;
      }),

    getWithUsages: protectedProcedure
      .input(creditGrantCodeSchema)
      .query(async ({ ctx, input }) => {
        const creditGrantCode = await getCreditGrantCodeWithUsages(
          ctx.session.user.id,
          input
        );

        if (!creditGrantCode) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Credit grant code not found',
          });
        }

        return creditGrantCode;
      }),

    redeem: protectedProcedure
      .input(redeemCreditGrantCodeSchema)
      .mutation(async ({ ctx, input }) => {
        return await redeemCreditGrantCode(ctx.session.user.id, input);
      }),
  },
});
