import z from 'zod';

import { db } from '@/lib/db';

export const getUserCreatorActivitySchema = z.object({
  startDate: z.date(),
  endDate: z.date().default(new Date()),
  numBuckets: z.number().optional().default(48),
  isCumulative: z.boolean().optional().default(false),
});

export const getUserCreatorActivity = async (
  userId: string,
  {
    startDate,
    endDate,
    numBuckets,
    isCumulative,
  }: z.infer<typeof getUserCreatorActivitySchema>
) => {

  // if cumulative, make the buckets twice as dense
  if (isCumulative) {
    numBuckets = numBuckets * 2;
  }


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

  if (isCumulative) {
    // For cumulative data, we need all transactions from beginning of time
    // Get them sorted by creation date for efficient single-pass processing
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

    // Single pass through transactions to build cumulative totals
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
        cumulativeTotalCost += Number(transaction.rawTransactionCost);
        cumulativeTotalProfit += Number(transaction.markUpProfit);
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
  }

  // Non-cumulative mode: only get transactions within the selected range
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

  // Single pass through transactions to populate buckets
  for (const transaction of transactions) {
    const bucketIndex = Math.floor(
      (transaction.createdAt.getTime() - startDate.getTime()) / bucketSizeMs
    );

    if (bucketIndex >= 0 && bucketIndex < numBuckets) {
      const bucket = buckets[bucketIndex];
      bucket.totalCost += Number(transaction.rawTransactionCost);
      bucket.totalProfit += Number(transaction.markUpProfit);
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
    }
  }

  return buckets;
};
