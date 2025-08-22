import z from 'zod';

import { db } from '@/lib/db';
import { paginationSchema, toPaginatedReponse } from '../lib/pagination';

export const getAppActivitySchema = z.object({
  echoAppId: z.uuid(),
  startDate: z.date(),
  endDate: z.date(),
  numBuckets: z.number().optional().default(48),
  userId: z.uuid().optional(),
});

export const getAppActivity = async ({
  echoAppId,
  startDate,
  endDate,
  numBuckets,
  userId,
}: z.infer<typeof getAppActivitySchema>) => {
  // Get all transactions for the time period
  const transactions = await db.transaction.findMany({
    where: {
      echoAppId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isArchived: false,
      ...(userId && { userId }),
    },
    select: {
      totalCost: true,
      transactionMetadata: true,
      markUpProfit: true,
      createdAt: true,
    },
  });

  // Calculate bucket size in milliseconds
  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(totalMs / numBuckets);

  // Initialize buckets
  const buckets = Array.from({ length: numBuckets }, (_, i) => {
    const bucketStart = new Date(startDate.getTime() + i * bucketSizeMs);
    return {
      timestamp: bucketStart,
      totalCost: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalProfit: 0,
      transactionCount: 0,
    };
  });

  // Group transactions into buckets
  for (const transaction of transactions) {
    const bucketIndex = Math.floor(
      (transaction.createdAt.getTime() - startDate.getTime()) / bucketSizeMs
    );

    if (bucketIndex >= 0 && bucketIndex < numBuckets) {
      const bucket = buckets[bucketIndex];
      bucket.totalCost += Number(transaction.totalCost);
      bucket.totalProfit += Number(transaction.markUpProfit);
      bucket.transactionCount += 1;
      // Extract token information from transactionMetadata
      if (transaction.transactionMetadata) {
        const metadata = transaction.transactionMetadata;

        if (metadata.totalTokens) {
          bucket.totalTokens += Number(metadata.totalTokens);
        }
        if (metadata.inputTokens) {
          bucket.totalInputTokens += Number(metadata.inputTokens);
        }
        if (metadata.outputTokens) {
          bucket.totalOutputTokens += Number(metadata.outputTokens);
        }
      }
    }
  }

  return buckets;
};

export const listAppUsersActivitySchema = z.object({
  echoAppId: z.uuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const listAppUsersActivity = async (
  { echoAppId, startDate, endDate }: z.infer<typeof listAppUsersActivitySchema>,
  { page, page_size }: z.infer<typeof paginationSchema>
) => {
  const [count, users] = await Promise.all([
    db.appMembership.count({
      where: {
        echoAppId,
        isArchived: false,
      },
    }),
    (async () => {
      const topUsersWithStats = await db.transaction.groupBy({
        by: ['userId'],
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
        _sum: {
          totalCost: true,
          rawTransactionCost: true,
          markUpProfit: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _sum: {
            totalCost: 'desc',
          },
        },
        skip: page * page_size,
        take: page_size,
      });

      // Get user details and membership info for the top users
      const userIds = topUsersWithStats.map(stat => stat.userId);

      const usersWithDetails = await db.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          appMemberships: {
            where: {
              echoAppId,
              isArchived: false,
              status: 'active',
            },
            select: {
              totalSpent: true,
              amountSpent: true,
              createdAt: true,
            },
          },
        },
      });

      // Combine the data
      const users = topUsersWithStats.map(stat => {
        const user = usersWithDetails.find(u => u.id === stat.userId);

        if (!user) {
          return null;
        }

        return {
          ...user,
          membership: user.appMemberships[0] ?? null,
          usage: {
            totalTransactions: stat._count.id,
            totalCost: Number(stat._sum.totalCost ?? 0),
            rawCost: Number(stat._sum.rawTransactionCost ?? 0),
            markupProfit: Number(stat._sum.markUpProfit ?? 0),
          },
        };
      });

      return users.filter(Boolean) as NonNullable<(typeof users)[number]>[];
    })(),
  ]);

  return toPaginatedReponse({
    items: users,
    total_count: count,
    page,
    page_size,
  });
};
