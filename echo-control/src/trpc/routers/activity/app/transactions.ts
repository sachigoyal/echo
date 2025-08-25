import {
  listAppTransactions,
  listAppTransactionsSchema,
} from '@/services/activity/app/transactions';
import {
  createTRPCRouter,
  paginatedProcedure,
  protectedProcedure,
} from '../../../trpc';

export const appTransactionsRouter = createTRPCRouter({
  list: paginatedProcedure
    .concat(protectedProcedure)
    .input(listAppTransactionsSchema)
    .query(async ({ ctx: { pagination }, input }) => {
      return listAppTransactions(input, pagination);
    }),
});
