import {
  createTRPCRouter,
  paginatedProcedure,
  protectedProcedure,
} from '@/trpc/trpc';

import { listPayments } from '@/services/payments';
import { createPaymentLink, createPaymentLinkSchema } from '@/services/stripe';

export const userPaymentsRouter = createTRPCRouter({
  list: paginatedProcedure.concat(protectedProcedure).query(async ({ ctx }) => {
    const { items, ...rest } = await listPayments(
      ctx.session.user.id,
      ctx.pagination
    );
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
