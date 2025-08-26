import z from 'zod';

import { format } from 'date-fns';

import { db } from '@/lib/db';

import type { PaginationParams } from '@/services/lib/pagination';

export const listAppTransactionsSchema = z.object({
  echoAppId: z.uuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const listAppTransactions = async (
  { echoAppId, startDate, endDate }: z.infer<typeof listAppTransactionsSchema>,
  { page, page_size }: PaginationParams
) => {
  // Single query to get all transactions with related data
  const transactions = await db.transaction.findMany({
    where: {
      echoAppId,
      isArchived: false,
      ...((startDate || endDate) && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: page * page_size,
    take: page_size,
  });

  // Group transactions by user, date, and model
  const groupedTransactions = new Map<
    string,
    {
      id: string;
      user: {
        id: string;
        name: string | null;
        image: string | null;
      };
      date: Date;
      callCount: number;
      appProfit: number;
    }
  >();

  for (const transaction of transactions) {
    const userKey = `${transaction.userId}-${format(transaction.createdAt, 'yyyy-MM-dd')}`;

    if (groupedTransactions.has(userKey)) {
      // Aggregate existing group
      const existing = groupedTransactions.get(userKey)!;
      existing.callCount += 1;
      existing.appProfit += Number(transaction.markUpProfit);
    } else {
      // Create new group
      groupedTransactions.set(userKey, {
        id: transaction.id,
        user: {
          id: transaction.userId,
          name: transaction.user.name,
          image: transaction.user.image,
        },
        callCount: 1,
        appProfit: Number(transaction.markUpProfit),
        date: transaction.createdAt,
      });
    }
  }

  // Convert to array and sort by date (newest first)
  const result = Array.from(groupedTransactions.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return result;
};
