import { db } from '@/services/db/client';

import {
  type PaginationParams,
  toPaginatedReponse,
} from '@/services/db/lib/pagination';

import { PayoutStatus } from '@/types/payouts';

import type { PayoutType } from '@/types/payouts';

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
