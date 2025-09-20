import z from 'zod';

import { db } from '@/lib/db';
import { TransactionMetadata } from '@/generated/prisma';

export const getUserCreatorActivitySchema = z.object({
  startDate: z.date(),
  endDate: z.date().default(new Date()),
  numBuckets: z.number().optional().default(48),
  isCumulative: z.boolean().optional().default(false),
});

const createBuckets = (startDate: Date, endDate: Date, numBuckets: number) => {
  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(totalMs / numBuckets);

  return Array.from({ length: numBuckets }, (_, i) => {
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
};

const updateBucketWithTransaction = (
  bucket: ReturnType<typeof createBuckets>[0],
  transaction: {
    rawTransactionCost: { toString(): string };
    transactionMetadata: TransactionMetadata | null;
    markUpProfit: { toString(): string };
  }
) => {
  bucket.totalCost += Number(transaction.rawTransactionCost.toString());
  bucket.totalProfit += Number(transaction.markUpProfit.toString());
  bucket.transactionCount += 1;

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
};

const getCumulativeActivity = async (
  userId: string,
  params: z.infer<typeof getUserCreatorActivitySchema>
) => {
  const { startDate, endDate, numBuckets } = params;

  // Make buckets twice as dense for cumulative data
  const denseBuckets = numBuckets * 2;
  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(totalMs / denseBuckets);

  const buckets = createBuckets(startDate, endDate, denseBuckets);

  // Get all transactions from beginning of time, sorted by creation date
  const allTransactions = await db.transaction.findMany({
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
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Track cumulative totals
  let cumulativeTotalCost = 0;
  let cumulativeTotalTokens = 0;
  let cumulativeTotalInputTokens = 0;
  let cumulativeTotalOutputTokens = 0;
  let cumulativeTotalProfit = 0;
  let cumulativeTransactionCount = 0;
  let transactionIndex = 0;

  return buckets.map(bucket => {
    const bucketEndTime = new Date(bucket.timestamp.getTime() + bucketSizeMs);

    // Process all transactions up to this bucket's end time
    while (
      transactionIndex < allTransactions.length &&
      allTransactions[transactionIndex].createdAt <= bucketEndTime
    ) {
      const transaction = allTransactions[transactionIndex];
      cumulativeTotalCost += Number(transaction.rawTransactionCost.toString());
      cumulativeTotalProfit += Number(transaction.markUpProfit.toString());
      cumulativeTransactionCount += 1;

      if (transaction.transactionMetadata) {
        const metadata = transaction.transactionMetadata;
        if (metadata.totalTokens) {
          cumulativeTotalTokens += Number(metadata.totalTokens);
        }
        if (metadata.inputTokens) {
          cumulativeTotalInputTokens += Number(metadata.inputTokens);
        }
        if (metadata.outputTokens) {
          cumulativeTotalOutputTokens += Number(metadata.outputTokens);
        }
      }

      transactionIndex++;
    }

    return {
      timestamp: bucket.timestamp,
      totalCost: cumulativeTotalCost,
      totalTokens: cumulativeTotalTokens,
      totalInputTokens: cumulativeTotalInputTokens,
      totalOutputTokens: cumulativeTotalOutputTokens,
      totalProfit: cumulativeTotalProfit,
      transactionCount: cumulativeTransactionCount,
    };
  });
};

const getNonCumulativeActivity = async (
  userId: string,
  params: z.infer<typeof getUserCreatorActivitySchema>
) => {
  const { startDate, endDate, numBuckets } = params;

  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.floor(totalMs / numBuckets);
  const buckets = createBuckets(startDate, endDate, numBuckets);

  // Get transactions only within the selected range
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

  // Populate buckets with transaction data
  for (const transaction of transactions) {
    const bucketIndex = Math.floor(
      (transaction.createdAt.getTime() - startDate.getTime()) / bucketSizeMs
    );

    if (bucketIndex >= 0 && bucketIndex < numBuckets) {
      updateBucketWithTransaction(buckets[bucketIndex], transaction);
    }
  }

  return buckets;
};

export const getUserCreatorActivity = async (
  userId: string,
  params: z.infer<typeof getUserCreatorActivitySchema>
) => {
  return params.isCumulative
    ? getCumulativeActivity(userId, params)
    : getNonCumulativeActivity(userId, params);
};
