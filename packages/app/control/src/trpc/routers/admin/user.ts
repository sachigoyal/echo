import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getUserAppsWithPagination } from '@/services/db/admin/user/apps';
import { getUserOverviewMetrics } from '@/services/db/admin/user/user-summary';
import { paginationParamsSchema } from '@/services/db/_lib/pagination';
import { multiSortParamsSchema } from '@/services/db/_lib/sorting';
import { filterParamsSchema } from '@/services/db/_lib/filtering';
import { getUser } from '@/services/db/admin/user/user';
import { getUserAppsCharts } from '@/services/db/admin/user/user-charts';

export const adminUserRouter = createTRPCRouter({
  getUserAppsWithPagination: adminProcedure
    .input(
      paginationParamsSchema
        .merge(multiSortParamsSchema)
        .merge(filterParamsSchema)
        .merge(z.object({ userId: z.string() }))
    )
    .query(async ({ input }) => {
      return await getUserAppsWithPagination(input);
    }),
  getUserOverviewMetrics: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await getUserOverviewMetrics(input.userId);
    }),
  getUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await getUser(input.userId);
    }),
  getUserAppsCharts: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        numBuckets: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getUserAppsCharts(input);
    }),
});
