import { z } from 'zod';

import { adminProcedure, protectedProcedure } from '../../trpc';

import {
  adminGetUsers,
  adminGetAppsForUser,
  downloadUsersCsv,
  downloadUsersCsvSchema,
  isAdmin,
} from '@/services/db/admin/admin';

export const adminBaseProcedures = {
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    return await isAdmin(ctx.session.user.id);
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
};
