import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getHomePageChart } from '@/services/admin/home-page';


export const adminTokensRouter = createTRPCRouter({
  getHomePageChart: adminProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          numBuckets: z.number().int().positive().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
        return await getHomePageChart(input);
    }),
});


