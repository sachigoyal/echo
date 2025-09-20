import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  calculateUserReferralEarnings,
  calculateUserReferralEarningsForApp,
  claimAllReferralRewards,
  claimReferralRewardForApp,
  listPendingReferralPayouts,
} from '@/services/db/ops/user/payouts/referrals';
import {
  calculateUserMarkupEarnings,
  calculateAppMarkupEarnings,
  claimAllMarkupRewards,
  claimMarkupRewardForApp,
  listPendingMarkupPayouts,
} from '@/services/db/ops/user/payouts/markup';

export const userPayoutRouter = createTRPCRouter({
  referral: {
    get: protectedProcedure.query(async ({ ctx }) => {
      return await calculateUserReferralEarnings(ctx.session.user.id);
    }),

    pending: protectedProcedure.query(async ({ ctx }) => {
      return await listPendingReferralPayouts(ctx.session.user.id);
    }),

    claimForApp: protectedProcedure
      .input(z.object({ appId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const payout = await claimReferralRewardForApp(
          ctx.session.user.id,
          input.appId
        );

        const remaining = await calculateUserReferralEarningsForApp(
          ctx.session.user.id,
          input.appId
        );

        return { payout, remaining };
      }),

    claimAll: protectedProcedure.mutation(async ({ ctx }) => {
      const payouts = await claimAllReferralRewards(ctx.session.user.id);
      const earnings = await calculateUserReferralEarnings(ctx.session.user.id);
      return { payouts, earnings };
    }),
  },
  markup: {
    get: protectedProcedure.query(async ({ ctx }) => {
      return await calculateUserMarkupEarnings(ctx.session.user.id);
    }),

    pending: protectedProcedure.query(async ({ ctx }) => {
      return await listPendingMarkupPayouts(ctx.session.user.id);
    }),

    claimForApp: protectedProcedure
      .input(z.object({ appId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const payout = await claimMarkupRewardForApp(
          ctx.session.user.id,
          input.appId
        );

        const remaining = await calculateAppMarkupEarnings(input.appId);

        return { payout, remaining };
      }),

    claimAll: protectedProcedure.mutation(async ({ ctx }) => {
      const payouts = await claimAllMarkupRewards(ctx.session.user.id);
      const earnings = await calculateUserMarkupEarnings(ctx.session.user.id);
      return { payouts, earnings };
    }),
  },
});
