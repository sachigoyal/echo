import { z } from 'zod';

import { adminProcedure, createTRPCRouter } from '../../trpc';

import { getTotalTokensChart } from '@/services/admin/total-tokens';

export const adminTokensRouter = createTRPCRouter({
  getTotalTokensChart: adminProcedure
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
      return await getTotalTokensChart(input);
    }),
});


