import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getUserAppsWithPagination } from '@/services/admin/user/apps';
import { getUserOverviewMetrics } from '@/services/admin/user/user-summary';
import { paginationParamsSchema } from '@/services/lib/pagination';
import { multiSortParamsSchema } from '@/services/lib/sorting';
import { filterParamsSchema } from '@/services/lib/filtering';
import { getUser } from '@/services/admin/user/user';
import { getUserAppsCharts } from '@/services/admin/user/user-charts';

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
