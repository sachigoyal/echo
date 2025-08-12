import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { isGlobalAdmin } from '@/lib/admin';
import { mintCreditsToUser } from '@/lib/admin/mint-credits';
import { getUsers } from '@/lib/admin';
import { getAppsForUser } from '@/lib/admin';

export const adminRouter = createTRPCRouter({
  isAdmin: protectedProcedure.query(async () => {
    return await isGlobalAdmin();
  }),

  mintCredits: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        amountInDollars: z.number().positive('Amount must be positive'),
        description: z.string().optional(),
        isFreeTier: z.boolean().optional().default(false),
        echoAppId: z.string().optional(),
        metadata: z.record(z.string(), z.string()).optional(),
        poolName: z.string().optional(),
        defaultSpendLimit: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        userId,
        amountInDollars,
        description,
        isFreeTier,
        echoAppId,
        metadata,
        poolName,
        defaultSpendLimit,
      } = input;

      await mintCreditsToUser(userId, amountInDollars, {
        description,
        isFreeTier,
        echoAppId,
        metadata,
        poolName,
        defaultSpendLimit,
      });

      return {
        success: true,
        message: `Successfully minted $${amountInDollars} to user ${userId}`,
      };
    }),

  getUsers: protectedProcedure.query(async () => {
    return await getUsers();
  }),

  getAppsForUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await getAppsForUser(input.userId);
    }),
});
