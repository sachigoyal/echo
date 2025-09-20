import { db } from '@/services/db/client';
import { PayoutStatus } from '@/types/payouts';
import {
  type PaginationParams,
  toPaginatedReponse,
} from '@/services/db/lib/pagination';

import type { PayoutType } from '@/types/payouts';
import { z } from 'zod';

export const adminGetPayoutSchema = z.object({
  payoutId: z.uuid(),
});

export const adminGetPayout = async ({
  payoutId,
}: z.infer<typeof adminGetPayoutSchema>) => {
  return await db.payout.findUnique({
    where: { id: payoutId },
    include: {
      recipientGithubLink: { select: { githubId: true } },
      echoApp: { include: { githubLink: { select: { githubId: true } } } },
    },
  });
};

export const adminUpdatePayoutSchema = z.object({
  payoutId: z.uuid(),
  status: z.enum(PayoutStatus),
  transactionId: z.string(),
  senderAddress: z.string(),
});

export const adminUpdatePayout = async (
  input: z.infer<typeof adminUpdatePayoutSchema>
) => {
  const { payoutId, ...data } = adminUpdatePayoutSchema.parse(input);
  return await db.payout.update({
    where: { id: payoutId },
    data,
  });
};

export async function adminListPendingPayouts(pagination: PaginationParams) {
  const { page, page_size } = pagination;
  const skip = page * page_size;

  const [items, totalCount] = await Promise.all([
    db.payout.findMany({
      where: { status: PayoutStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      skip,
      take: page_size,
      include: {
        user: { select: { id: true, email: true, name: true } },
        echoApp: {
          select: {
            id: true,
            name: true,
            githubLink: { select: { githubId: true } },
          },
        },
        recipientGithubLink: { select: { id: true, githubUrl: true } },
      },
    }),
    db.payout.count({ where: { status: PayoutStatus.PENDING } }),
  ]);

  return toPaginatedReponse({
    items: items.map(item => ({
      ...item,
      type: item.type as PayoutType,
      amount: Number(item.amount),
    })),
    page,
    page_size,
    total_count: totalCount,
  });
}

export async function adminListCompletedPayouts(pagination: PaginationParams) {
  const { page, page_size } = pagination;
  const skip = page * page_size;

  const [items, totalCount] = await Promise.all([
    db.payout.findMany({
      where: { status: PayoutStatus.COMPLETED },
      orderBy: { createdAt: 'desc' },
      skip,
      take: page_size,
      include: {
        user: { select: { id: true, email: true, name: true } },
        echoApp: { select: { id: true, name: true } },
        recipientGithubLink: { select: { id: true, githubUrl: true } },
      },
    }),
    db.payout.count({ where: { status: PayoutStatus.COMPLETED } }),
  ]);

  return toPaginatedReponse({
    items: items.map(item => ({
      ...item,
      type: item.type as PayoutType,
      amount: Number(item.amount),
    })),
    page,
    page_size,
    total_count: totalCount,
  });
}
