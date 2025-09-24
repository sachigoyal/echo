import { db } from '@/services/db/client';

import {
  type PaginationParams,
  toPaginatedReponse,
} from '@/services/db/_lib/pagination';

import type { Prisma } from '@/generated/prisma';

export async function listCreditPayments(
  userId: string,
  pagination: PaginationParams
) {
  return listPayments(
    {
      userId,
      isArchived: false,
      spendPoolId: null,
      description: {
        not: {
          contains: 'Free Tier Credits',
        },
      },
    },
    pagination
  );
}

export async function listFreeTierPayments(
  userId: string,
  appId: string,
  pagination: PaginationParams
) {
  return listPayments(
    {
      userId,
      isArchived: false,
      spendPool: {
        echoAppId: appId,
      },
    },
    pagination
  );
}

async function listPayments(
  where: Prisma.PaymentWhereInput,
  { page, page_size }: PaginationParams
) {
  const skip = page * page_size;
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

  // Add filter to exclude pending payments older than 5 hours
  const enhancedWhere: Prisma.PaymentWhereInput = {
    ...where,
    OR: [
      // Include all non-pending payments
      {
        status: {
          not: 'pending',
        },
      },
      // Include pending payments that are less than 5 hours old
      {
        status: 'pending',
        createdAt: {
          gte: fiveHoursAgo,
        },
      },
    ],
  };

  const [payments, totalCount] = await Promise.all([
    db.payment.findMany({
      where: enhancedWhere,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: page_size,
    }),
    db.payment.count({
      where: enhancedWhere,
    }),
  ]);

  return toPaginatedReponse({
    items: payments.map(payment => ({
      ...payment,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      archivedAt: payment.archivedAt?.toISOString(),
      amount: Number(payment.amount),
    })),
    page,
    page_size,
    total_count: totalCount,
  });
}
