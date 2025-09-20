import {
  adminProcedure,
  createTRPCRouter,
  paginatedProcedure,
} from '../../trpc';

import {
  adminCreateCreditGrant,
  adminGetCreditGrant,
  adminGetCreditGrantSchema,
  adminListCreditGrants,
  adminListCreditGrantUsages,
  adminListCreditGrantUsagesSchema,
  adminUpdateCreditGrant,
} from '@/services/db/ops/admin/admin';
import {
  adminCreateCreditGrantSchema,
  adminUpdateCreditGrantSchema,
} from '@/services/db/ops/admin/schemas';

import { TRPCError } from '@trpc/server';

export const adminCreditGrantsRouter = createTRPCRouter({
  grant: {
    get: adminProcedure
      .input(adminGetCreditGrantSchema)
      .query(async ({ input }) => {
        const creditGrant = await adminGetCreditGrant(input);
        if (!creditGrant) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return creditGrant;
      }),

    update: adminProcedure
      .input(adminUpdateCreditGrantSchema)
      .mutation(async ({ input }) => {
        return await adminUpdateCreditGrant(input);
      }),

    listUsers: paginatedProcedure
      .concat(adminProcedure)
      .input(adminListCreditGrantUsagesSchema)
      .query(async ({ input, ctx }) => {
        return await adminListCreditGrantUsages(input, ctx.pagination);
      }),
  },

  list: paginatedProcedure.concat(adminProcedure).query(async ({ ctx }) => {
    return await adminListCreditGrants(ctx.pagination);
  }),

  create: adminProcedure
    .input(adminCreateCreditGrantSchema)
    .mutation(async ({ input }) => {
      return await adminCreateCreditGrant(input);
    }),
});
