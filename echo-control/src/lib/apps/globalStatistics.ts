import { db } from '@/lib/db';
import { GlobalStatistics, LlmTransactionMetadata } from './types';
import { Prisma } from '@/generated/prisma';
import { getAppActivity, getAppActivityBatch } from './appActivity';
import { getModelUsage, getModelUsageBatch } from './modelUsage';

/**
 * Get global statistics for an echo app
 * @param echoAppId - The ID of the echo app
 * @param tx - Optional Prisma transaction client
 * @returns Global statistics including totals, activity data, and model usage
 */
export async function getGlobalStatistics(
  echoAppId: string,
  tx?: Prisma.TransactionClient
): Promise<GlobalStatistics> {
  const client = tx || db;

  // Get all transactions for this app
  const transactions = await client.transaction.findMany({
    where: {
      echoAppId,
      isArchived: false,
    },
    select: {
      cost: true,
      metadata: true,
      createdAt: true,
    },
  });

  // Calculate global totals
  let globalTotalRevenue = 0;
  let globalTotalTokens = 0;
  let globalTotalInputTokens = 0;
  let globalTotalOutputTokens = 0;

  // Process each transaction
  for (const transaction of transactions) {
    globalTotalRevenue += Number(transaction.cost);

    // Extract token information from metadata
    const metadata = transaction.metadata as LlmTransactionMetadata | null;
    if (metadata) {
      // Token counts
      if (metadata.totalTokens) {
        globalTotalTokens += metadata.totalTokens;
      }
      if (metadata.inputTokens) {
        globalTotalInputTokens += metadata.inputTokens;
      }
      if (metadata.outputTokens) {
        globalTotalOutputTokens += metadata.outputTokens;
      }
    }
  }

  const globalActivityData = await getAppActivity(
    echoAppId,
    7,
    undefined,
    client
  );

  const globalModelUsage = await getModelUsage(echoAppId, undefined, client);

  return {
    globalTotalTransactions: transactions.length,
    globalTotalRevenue,
    globalTotalTokens,
    globalTotalInputTokens,
    globalTotalOutputTokens,
    globalActivityData,
    globalModelUsage,
  };
}

/**
 * Batch fetch global statistics for multiple echo apps
 * This is optimized to minimize database queries by fetching all data at once
 * @param echoAppIds - Array of echo app IDs
 * @param tx - Optional Prisma transaction client
 * @returns Map of echo app ID to global statistics
 */
export async function getGlobalStatisticsBatch(
  echoAppIds: string[],
  tx?: Prisma.TransactionClient
): Promise<Map<string, GlobalStatistics>> {
  const client = tx || db;

  // Step 1: Fetch all transactions for all apps in a single query
  const allTransactions = await client.transaction.findMany({
    where: {
      echoAppId: { in: echoAppIds },
      isArchived: false,
    },
    select: {
      echoAppId: true,
      cost: true,
      metadata: true,
      createdAt: true,
    },
  });

  // Step 2: Group transactions by app and calculate statistics
  type AppStats = {
    transactions: typeof allTransactions;
    globalTotalRevenue: number;
    globalTotalTokens: number;
    globalTotalInputTokens: number;
    globalTotalOutputTokens: number;
  };

  const statsMap = new Map<string, AppStats>();

  // Initialize stats for each app
  for (const appId of echoAppIds) {
    statsMap.set(appId, {
      transactions: [],
      globalTotalRevenue: 0,
      globalTotalTokens: 0,
      globalTotalInputTokens: 0,
      globalTotalOutputTokens: 0,
    });
  }

  // Process each transaction
  for (const transaction of allTransactions) {
    const appStats = statsMap.get(transaction.echoAppId);
    if (!appStats) continue;

    appStats.transactions.push(transaction);
    appStats.globalTotalRevenue += Number(transaction.cost);

    // Extract token information from metadata
    const metadata = transaction.metadata as LlmTransactionMetadata | null;
    if (metadata) {
      // Token counts
      if (metadata.totalTokens) {
        appStats.globalTotalTokens += metadata.totalTokens;
      }
      if (metadata.inputTokens) {
        appStats.globalTotalInputTokens += metadata.inputTokens;
      }
      if (metadata.outputTokens) {
        appStats.globalTotalOutputTokens += metadata.outputTokens;
      }
    }
  }

  // Step 3: Batch fetch activity data for all apps
  const activityDataMap = await getAppActivityBatch(
    echoAppIds,
    7,
    undefined,
    client
  );

  // Step 4: Batch fetch model usage for all apps
  const modelUsageMap = await getModelUsageBatch(echoAppIds, undefined, client);

  // Step 5: Combine all data into final statistics
  const resultMap = new Map<string, GlobalStatistics>();

  for (const [appId, appStats] of statsMap) {
    const globalActivityData = activityDataMap.get(appId) || [];
    const globalModelUsage = modelUsageMap.get(appId) || [];

    resultMap.set(appId, {
      globalTotalTransactions: appStats.transactions.length,
      globalTotalRevenue: appStats.globalTotalRevenue,
      globalTotalTokens: appStats.globalTotalTokens,
      globalTotalInputTokens: appStats.globalTotalInputTokens,
      globalTotalOutputTokens: appStats.globalTotalOutputTokens,
      globalActivityData,
      globalModelUsage,
    });
  }

  return resultMap;
}
