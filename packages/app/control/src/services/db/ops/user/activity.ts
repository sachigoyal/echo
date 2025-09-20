import z from 'zod';

import { db } from '@/services/db/client';

export const getUserCreatorActivitySchema = z.object({
  startDate: z.date(),
  endDate: z.date().default(new Date()),
  numBuckets: z.number().optional().default(48),
});

export const getUserCreatorActivity = async (
  userId: string,
  {
    startDate,
    endDate,
    numBuckets,
  }: z.infer<typeof getUserCreatorActivitySchema>
) => {
  // Get all transactions for the time period
  const transactions = await db.transaction.findMany({
    where: {
      echoApp: {
        appMemberships: {
          some: {
            userId,
            role: 'owner',
          },
        },
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      isArchived: false,
    },
    select: {
      rawTransactionCost: true,
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
      bucket.totalCost += Number(transaction.rawTransactionCost);
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
