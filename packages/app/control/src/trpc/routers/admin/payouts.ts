import {
  adminProcedure,
  createTRPCRouter,
  paginatedProcedure,
} from '../../trpc';

import {
  adminListPendingPayouts,
  adminListCompletedPayouts,
  adminGetPayoutSchema,
} from '@/services/db/admin/payouts';
import {
  generateCheckoutUrlForPayout,
  pollMeritCheckout,
  syncPendingPayoutsOnce,
} from '@/services/merit';

export const adminPayoutsRouter = createTRPCRouter({
  list: {
    pending: paginatedProcedure
      .concat(adminProcedure)
      .query(async ({ ctx }) => {
        return await adminListPendingPayouts(ctx.pagination);
      }),
    completed: paginatedProcedure
      .concat(adminProcedure)
      .query(async ({ ctx }) => {
        return await adminListCompletedPayouts(ctx.pagination);
      }),
  },
  startMeritCheckout: adminProcedure
    .input(adminGetPayoutSchema)
    .mutation(async ({ input }) => {
      const checkoutUrl = await generateCheckoutUrlForPayout(input);
      if (!checkoutUrl) {
        throw new Error('Checkout URL not found');
      }
      return { url: checkoutUrl.url };
    }),
  pollMeritCheckout: adminProcedure
    .input(adminGetPayoutSchema)
    .mutation(async ({ input }) => {
      return await pollMeritCheckout(input.payoutId);
    }),
  syncPending: adminProcedure.mutation(async () => {
    return await syncPendingPayoutsOnce();
  }),
});
