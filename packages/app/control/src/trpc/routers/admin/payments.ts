import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getPaymentsWithPagination } from '@/services/admin/payments';
import { paginationParamsSchema } from '@/services/lib/pagination';
import { multiSortParamsSchema } from '@/services/lib/sorting';
import { filterParamsSchema } from '@/services/lib/filtering';

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
});
