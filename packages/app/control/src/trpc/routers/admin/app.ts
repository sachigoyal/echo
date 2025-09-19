import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getAppUsersWithPagination } from '@/services/admin/app/users';
import { paginationParamsSchema } from '@/services/lib/pagination';
import { multiSortParamsSchema } from '@/services/lib/sorting';
import { filterParamsSchema } from '@/services/lib/filtering';
import { getApp } from '@/services/admin/app/app';

export const adminAppRouter = createTRPCRouter({
  getAppUsersWithPagination: adminProcedure
    .input(
      paginationParamsSchema
        .merge(multiSortParamsSchema)
        .merge(filterParamsSchema)
        .merge(z.object({ appId: z.string() }))
    )
    .query(async ({ input }) => {
      return await getAppUsersWithPagination(input);
    }),
  getApp: adminProcedure
    .input(z.object({ appId: z.string() }))
    .query(async ({ input }) => {
      return await getApp(input.appId);
    }),
});
