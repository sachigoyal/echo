import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getUserEarningsWithPagination } from '@/services/db/ops/admin/user-earnings';
import { getAppEarningsWithPagination } from '@/services/db/ops/admin/app-earnings';
import { getUserEarningsOverviewMetrics } from '@/services/db/ops/admin/user-earning-summary';
import { getAppEarningsOverviewMetrics } from '@/services/db/ops/admin/app-earnings-summary';
import { paginationParamsSchema } from '@/services/db/lib/pagination';
import { multiSortParamsSchema } from '@/services/db/lib/sorting';
import { filterParamsSchema } from '@/services/db/lib/filtering';

export const adminEarningsRouter = createTRPCRouter({
  getUserEarningsWithPagination: adminProcedure
    .input(
      paginationParamsSchema
        .merge(multiSortParamsSchema)
        .merge(filterParamsSchema)
    )
    .query(async ({ input }) => {
      return await getUserEarningsWithPagination(input);
    }),

  getAppEarningsWithPagination: adminProcedure
    .input(
      paginationParamsSchema
        .merge(multiSortParamsSchema)
        .merge(filterParamsSchema)
    )
    .query(async ({ input }) => {
      return await getAppEarningsWithPagination(input);
    }),

  getUserEarningsOverviewMetrics: adminProcedure.query(async () => {
    return await getUserEarningsOverviewMetrics();
  }),

  getAppEarningsOverviewMetrics: adminProcedure.query(async () => {
    return await getAppEarningsOverviewMetrics();
  }),
});
