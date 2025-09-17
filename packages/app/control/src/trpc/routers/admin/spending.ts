import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getUserSpendingWithPagination } from '@/services/admin/user-spending';
import { paginationParamsSchema } from '@/services/lib/pagination';
import { multiSortParamsSchema } from '@/services/lib/sorting';
import { filterParamsSchema } from '@/services/lib/filtering';

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
});
