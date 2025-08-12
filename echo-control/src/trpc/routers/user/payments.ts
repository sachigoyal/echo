import { infiniteQueryPaginationParamsSchema } from '@/trpc/lib/infinite-query';
import { createTRPCRouter, protectedProcedure } from '../../trpc';

import { listPayments } from '@/services/payments';

export const userPaymentsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(infiniteQueryPaginationParamsSchema)
    .query(async ({ ctx, input }) => {
      const { items, ...rest } = await listPayments(ctx.session.user.id, input);
      return {
        ...rest,
        items: items.map(item => ({
          ...item,
          amount: Number(item.amount),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          archivedAt: item.archivedAt?.toISOString(),
        })),
      };
    }),
});
