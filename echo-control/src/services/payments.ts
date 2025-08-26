import { z } from 'zod';

import { db } from '@/lib/db';

import { type PaginationParams, toPaginatedReponse } from './lib/pagination';

export async function listPayments(
  userId: string,
  { page, page_size }: PaginationParams
) {
  const skip = page * page_size;

  const [payments, totalCount] = await Promise.all([
    db.payment.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: page_size,
    }),
    db.payment.count({
      where: {
        userId,
        isArchived: false,
      },
    }),
  ]);

  return toPaginatedReponse({
    items: payments,
    page,
    page_size,
    total_count: totalCount,
  });
}
