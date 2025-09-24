import {
  adminProcedure,
  createTRPCRouter,
  paginatedProcedure,
} from '../../trpc';

import {
  adminListPendingPayouts,
  adminListCompletedPayouts,
  adminListStartedPayoutBatches,
  adminGroupedUserPayoutSchema,
} from '@/services/db/admin/payouts';

import {
  startPayoutBatch,
  pollAvailablePaymentBatches,
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
    started: paginatedProcedure.concat(adminProcedure).query(async () => {
      return await adminListStartedPayoutBatches();
    }),
  },
  startPayoutBatch: adminProcedure
    .input(adminGroupedUserPayoutSchema)
    .mutation(async ({ input }) => {
      return await startPayoutBatch(input);
    }),
  pollForPayoutBatchCompletion: adminProcedure.query(async () => {
    return await pollAvailablePaymentBatches();
  }),
});
