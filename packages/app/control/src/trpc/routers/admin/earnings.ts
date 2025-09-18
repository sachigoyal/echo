import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getUserEarningsWithPagination } from '@/services/admin/user-earnings';
import { getAppEarningsWithPagination } from '@/services/admin/app-earnings';
import { paginationParamsSchema } from '@/services/lib/pagination';
import { multiSortParamsSchema } from '@/services/lib/sorting';
import { filterParamsSchema } from '@/services/lib/filtering';

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
});
