import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getUserSpendingWithPagination } from '@/services/db/ops/admin/user-spending';
import { getUserSpendingOverviewMetrics } from '@/services/db/ops/admin/user-spending-summary';
import { paginationParamsSchema } from '@/services/db/lib/pagination';
import { multiSortParamsSchema } from '@/services/db/lib/sorting';
import { filterParamsSchema } from '@/services/db/lib/filtering';

export const adminSpendingRouter = createTRPCRouter({
  getUserSpendingWithPagination: adminProcedure
    .input(
      paginationParamsSchema
        .merge(multiSortParamsSchema)
        .merge(filterParamsSchema)
    )
    .query(async ({ input }) => {
      return await getUserSpendingWithPagination(input);
    }),

  getUserSpendingOverviewMetrics: adminProcedure.query(async () => {
    return await getUserSpendingOverviewMetrics();
  }),
});
