import { createTRPCRouter, protectedProcedure } from '@/trpc/trpc';

import { infiniteQueryPaginationParamsSchema } from '@/trpc/lib/infinite-query';

import { listPayments } from '@/services/payments';
import { createPaymentLink, createPaymentLinkSchema } from '@/services/stripe';

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

  createLink: protectedProcedure
    .input(createPaymentLinkSchema)
    .mutation(async ({ ctx, input }) => {
      return await createPaymentLink(ctx.session.user.id, input);
    }),
});
