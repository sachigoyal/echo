import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../trpc';

import {
  adminGetUsers,
  adminGetAppsForUser,
  adminMintCreditsToUser,
  adminMintCreditReferralCode,
  adminMintCreditReferralCodeSchema,
} from '@/services/admin';
import { mintCreditsToUserSchema } from '@/services/credits';

export const adminRouter = createTRPCRouter({
  isAdmin: adminProcedure.query(async () => {
    return true;
  }),

  mintCredits: adminProcedure
    .input(mintCreditsToUserSchema)
    .mutation(async ({ input }) => {
      await adminMintCreditsToUser(input);

      return {
        success: true,
        message: `Successfully minted $${input.amountInDollars} to user ${input.userId}`,
      };
    }),

  getUsers: adminProcedure.query(async () => {
    return await adminGetUsers();
  }),

  getAppsForUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await adminGetAppsForUser(input.userId);
    }),

  mintCreditReferralCode: adminProcedure
    .input(adminMintCreditReferralCodeSchema)
    .mutation(async ({ input }) => {
      return await adminMintCreditReferralCode(input);
    }),
});
