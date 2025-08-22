import z from 'zod';

import { db } from '@/lib/db';

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

export const getTopAppUsers = async (echoAppId: string, limit: number = 10) => {
  // Get top users with their transaction statistics using a single query with aggregation
  const topUsersWithStats = await db.transaction.groupBy({
    by: ['userId'],
    where: {
      echoAppId,
      isArchived: false,
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
    take: limit,
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
  const usersWithStats = topUsersWithStats.map(stat => {
    const user = usersWithDetails.find(u => u.id === stat.userId);
    const membership = user?.appMemberships[0];

    return {
      id: user?.id ?? stat.userId,
      name: user?.name ?? null,
      email: user?.email ?? '',
      image: user?.image ?? null,
      membership: {
        totalSpent: Number(membership?.totalSpent ?? 0),
        amountSpent: Number(membership?.amountSpent ?? 0),
        joinedAt: membership?.createdAt ?? null,
      },
      usage: {
        totalTransactions: stat._count.id,
        totalCost: Number(stat._sum.totalCost ?? 0),
        rawCost: Number(stat._sum.rawTransactionCost ?? 0),
        markupProfit: Number(stat._sum.markUpProfit ?? 0),
      },
    };
  });

  return usersWithStats;
};
