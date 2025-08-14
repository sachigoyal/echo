import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  mintUserReferralCode,
  setAppReferralReward,
  getCurrentReferralReward,
} from '@/lib/referral-codes/user-referral';

const mintUserReferralCodeSchema = z.object({
  echoAppId: z.string().uuid(),
  expiresAt: z.date().optional(),
});

const setAppReferralRewardSchema = z.object({
  echoAppId: z.string().uuid(),
  reward: z.number().min(1),
});

const getCurrentReferralRewardSchema = z.object({
  echoAppId: z.string().uuid(),
});

export const userReferralRouter = createTRPCRouter({
  mint: protectedProcedure
    .input(mintUserReferralCodeSchema)
    .mutation(async ({ ctx, input }) => {
      return mintUserReferralCode(
        ctx.session.user.id,
        input.echoAppId,
        input.expiresAt
      );
    }),
  setAppReferralReward: protectedProcedure
    .input(setAppReferralRewardSchema)
    .mutation(async ({ ctx, input }) => {
      return setAppReferralReward(
        ctx.session.user.id,
        input.echoAppId,
        input.reward
      );
    }),
  getCurrentReferralReward: protectedProcedure
    .input(getCurrentReferralRewardSchema)
    .query(async ({ ctx, input }) => {
      return getCurrentReferralReward(ctx.session.user.id, input.echoAppId);
    }),
});
