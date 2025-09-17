import { z } from 'zod';

import { adminProcedure, protectedProcedure } from '../../trpc';

import {
  adminGetUsers,
  adminGetAppsForUser,
  adminMintCreditsToUser,
  adminMintCreditReferralCode,
  adminMintCreditReferralCodeSchema,
  downloadUsersCsv,
  downloadUsersCsvSchema,
  isAdmin,
} from '@/services/admin/admin';
import { mintCreditsToUserSchema } from '@/services/credits';

export const adminBaseProcedures = {
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    return await isAdmin(ctx.session.user.id);
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

  downloadUsersCsv: adminProcedure
    .input(downloadUsersCsvSchema)
    .mutation(async ({ input }) => {
      return await downloadUsersCsv(input);
    }),

  mintCreditReferralCode: adminProcedure
    .input(adminMintCreditReferralCodeSchema)
    .mutation(async ({ input }) => {
      return await adminMintCreditReferralCode(input);
    }),
};
