import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getPaymentsWithPagination } from '@/services/db/admin/payments';
import { getPaymentsOverviewMetrics } from '@/services/db/admin/payments-summary';
import { paginationParamsSchema } from '@/services/db/_lib/pagination';
import { multiSortParamsSchema } from '@/services/db/_lib/sorting';
import { filterParamsSchema } from '@/services/db/_lib/filtering';

export const adminPaymentsRouter = createTRPCRouter({
  getPaymentsWithPagination: adminProcedure
    .input(
      paginationParamsSchema
        .merge(multiSortParamsSchema)
        .merge(filterParamsSchema)
    )
    .query(async ({ input }) => {
      return await getPaymentsWithPagination(input);
    }),

  getPaymentsOverviewMetrics: adminProcedure.query(async () => {
    return await getPaymentsOverviewMetrics();
  }),
});
