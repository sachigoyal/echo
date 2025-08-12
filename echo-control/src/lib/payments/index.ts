import { z } from 'zod';

import { db } from '@/lib/db';

import { paginationParamsSchema } from '../pagination';

import type { PaginatedResponse } from '@/types/paginated-response';
import type { Payment } from '@/generated/prisma';

export async function listPayments(
  userId: string,
  { page = 0, page_size = 10 }: z.infer<typeof paginationParamsSchema>
): Promise<PaginatedResponse<Payment>> {
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

  const totalPages = Math.ceil(totalCount / page_size);

  return {
    items: payments,
    page,
    page_size,
    total_count: totalCount,
    has_next: page < totalPages - 1,
  };
}
