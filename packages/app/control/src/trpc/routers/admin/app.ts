import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getAppUsersWithPagination } from '@/services/db/ops/admin/app/users';
import { paginationParamsSchema } from '@/services/db/_lib/pagination';
import { multiSortParamsSchema } from '@/services/db/_lib/sorting';
import { filterParamsSchema } from '@/services/db/_lib/filtering';
import { getApp } from '@/services/db/ops/admin/app/app';

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
