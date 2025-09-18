import { z } from 'zod';

import {
  adminProcedure,
  createTRPCRouter,
  paginatedProcedure,
} from '../../trpc';

import { adminListPendingPayouts } from '@/services/admin/pending-payouts';
import { adminListCompletedPayouts } from '@/services/admin/completed-payouts';
import {
  generateCheckoutUrlForPayout,
  pollMeritCheckout,
  syncPendingPayoutsOnce,
} from '@/services/payouts/merit';

export const adminPayoutsRouter = createTRPCRouter({
  listPending: paginatedProcedure
    .concat(adminProcedure)
    .query(async ({ ctx }) => {
      return await adminListPendingPayouts(ctx.pagination);
    }),
  listCompleted: paginatedProcedure
    .concat(adminProcedure)
    .query(async ({ ctx }) => {
      return await adminListCompletedPayouts(ctx.pagination);
    }),
  startMeritCheckout: adminProcedure
    .input(z.object({ payoutId: z.string() }))
    .mutation(async ({ input }) => {
      const checkoutUrl = await generateCheckoutUrlForPayout(input.payoutId);
      if (!checkoutUrl) {
        throw new Error('Checkout URL not found');
      }
      return { url: checkoutUrl.url };
    }),
  pollMeritCheckout: adminProcedure
    .input(z.object({ payoutId: z.string() }))
    .mutation(async ({ input }) => {
      return await pollMeritCheckout(input.payoutId);
    }),
  syncPending: adminProcedure.mutation(async () => {
    return await syncPendingPayoutsOnce();
  }),
});
