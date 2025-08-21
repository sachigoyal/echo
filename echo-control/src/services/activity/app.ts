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
