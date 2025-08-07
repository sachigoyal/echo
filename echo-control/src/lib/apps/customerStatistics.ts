import { db } from '@/lib/db';
import {
  CustomerStatistics,
  CustomerApiKey,
  LlmTransactionMetadata,
} from './types';
import { Prisma } from '@/generated/prisma';
import {
  getGlobalStatistics,
  getGlobalStatisticsBatch,
} from './globalStatistics';
import { getAppActivity, getAppActivityBatch } from './appActivity';
import { getModelUsage, getModelUsageBatch } from './modelUsage';
import { serializeTransactions } from '@/lib/utils/serialization';

const RECENT_TRANSACTIONS_LIMIT = 10;

/**
 * Get customer statistics for an echo app
 * @param echoAppId - The ID of the echo app
 * @param userId - The ID of the user/customer
 * @param tx - Optional Prisma transaction client
 * @returns Customer statistics including both global and personal data
 */
export async function getCustomerStatistics(
  echoAppId: string,
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<CustomerStatistics> {
  const client = tx || db;

  // Get global statistics first
  const globalStats = await getGlobalStatistics(echoAppId, client);

  // Get user's API keys for this app
  const apiKeys = (await client.apiKey.findMany({
    where: {
      echoAppId,
      userId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      echoAppId: true,
      userId: true,
      isArchived: true,
      archivedAt: true,
      lastUsed: true,
    },
  })) as CustomerApiKey[];

  // Get user's transactions for this app
  const personalTransactions = await client.transaction.findMany({
    where: {
      echoAppId,
      userId,
      isArchived: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: RECENT_TRANSACTIONS_LIMIT, // Get recent transactions
  });

  // Calculate personal totals
  let personalTotalRevenue = 0;
  let personalTotalTokens = 0;
  let personalTotalInputTokens = 0;
  let personalTotalOutputTokens = 0;

  // Get all user's transactions for totals calculation
  const allPersonalTransactions = await client.transaction.findMany({
    where: {
      echoAppId,
      userId,
      isArchived: false,
    },
    select: {
      cost: true,
      metadata: true,
      createdAt: true,
    },
  });

  // Process each transaction
  for (const transaction of allPersonalTransactions) {
    personalTotalRevenue += Number(transaction.cost);

    // Extract token information from metadata
    const metadata = transaction.metadata as LlmTransactionMetadata | null;
    if (metadata) {
      // Token counts
      if (metadata.totalTokens) {
        personalTotalTokens += metadata.totalTokens;
      }
      if (metadata.inputTokens) {
        personalTotalInputTokens += metadata.inputTokens;
      }
      if (metadata.outputTokens) {
        personalTotalOutputTokens += metadata.outputTokens;
      }
    }
  }

  // Get personal activity data (last 7 days)
  const personalActivityData = await getAppActivity(
    echoAppId,
    7,
    userId,
    client
  );

  // Get personal model usage
  const personalModelUsage = await getModelUsage(echoAppId, userId, client);

  return {
    // Spread global statistics
    ...globalStats,
    // Add personal statistics
    personalTotalRevenue,
    personalTotalTokens,
    personalTotalInputTokens,
    personalTotalOutputTokens,
    personalRecentTransactions: serializeTransactions(personalTransactions),
    personalModelUsage,
    personalActivityData,
    personalApiKeys: apiKeys,
  };
}

/**
 * Batch fetch customer statistics for multiple echo apps for a specific user
 * This is optimized to minimize database queries by fetching all data at once
 * @param echoAppIds - Array of echo app IDs
 * @param userId - The ID of the user/customer
 * @param tx - Optional Prisma transaction client
 * @returns Map of echo app ID to customer statistics
 */
export async function getCustomerStatisticsBatch(
  echoAppIds: string[],
  userId: string,
  tx?: Prisma.TransactionClient
): Promise<Map<string, CustomerStatistics>> {
  const client = tx || db;

  // Step 1: Get global statistics for all apps
  const globalStatsMap = await getGlobalStatisticsBatch(echoAppIds, client);

  // Step 2: Get all user's API keys for all apps in one query
  const allApiKeys = (await client.apiKey.findMany({
    where: {
      echoAppId: { in: echoAppIds },
      userId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      echoAppId: true,
      userId: true,
      isArchived: true,
      archivedAt: true,
      lastUsed: true,
    },
  })) as CustomerApiKey[];

  // Group API keys by app
  const apiKeysByApp = new Map<string, CustomerApiKey[]>();
  for (const appId of echoAppIds) {
    apiKeysByApp.set(appId, []);
  }
  for (const apiKey of allApiKeys) {
    const appKeys = apiKeysByApp.get(apiKey.echoAppId);
    if (appKeys) {
      appKeys.push(apiKey as CustomerApiKey);
    }
  }

  // Step 3: Get all user's transactions for all apps
  const allPersonalTransactions = await client.transaction.findMany({
    where: {
      echoAppId: { in: echoAppIds },
      userId,
      isArchived: false,
    },
  });

  // Group transactions by app and calculate statistics
  type PersonalStats = {
    allTransactions: typeof allPersonalTransactions;
    recentTransactions: typeof allPersonalTransactions;
    personalTotalRevenue: number;
    personalTotalTokens: number;
    personalTotalInputTokens: number;
    personalTotalOutputTokens: number;
  };

  const personalStatsMap = new Map<string, PersonalStats>();

  // Initialize stats for each app
  for (const appId of echoAppIds) {
    personalStatsMap.set(appId, {
      allTransactions: [],
      recentTransactions: [],
      personalTotalRevenue: 0,
      personalTotalTokens: 0,
      personalTotalInputTokens: 0,
      personalTotalOutputTokens: 0,
    });
  }

  // Process transactions
  for (const transaction of allPersonalTransactions) {
    const appStats = personalStatsMap.get(transaction.echoAppId);
    if (!appStats) continue;

    appStats.allTransactions.push(transaction);
    appStats.personalTotalRevenue += Number(transaction.cost);

    // Extract token information from metadata
    const metadata = transaction.metadata as LlmTransactionMetadata | null;
    if (metadata) {
      // Token counts
      if (metadata.totalTokens) {
        appStats.personalTotalTokens += metadata.totalTokens;
      }
      if (metadata.inputTokens) {
        appStats.personalTotalInputTokens += metadata.inputTokens;
      }
      if (metadata.outputTokens) {
        appStats.personalTotalOutputTokens += metadata.outputTokens;
      }
    }
  }

  // Sort and limit recent transactions for each app
  for (const stats of personalStatsMap.values()) {
    stats.recentTransactions = stats.allTransactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, RECENT_TRANSACTIONS_LIMIT);
  }

  // Step 4: Get personal activity data for all apps
  const personalActivityMap = await getAppActivityBatch(
    echoAppIds,
    7,
    userId,
    client
  );

  // Step 5: Get personal model usage for all apps
  const personalModelUsageMap = await getModelUsageBatch(
    echoAppIds,
    userId,
    client
  );

  // Step 6: Combine all data into final statistics
  const resultMap = new Map<string, CustomerStatistics>();

  for (const appId of echoAppIds) {
    const globalStats = globalStatsMap.get(appId);
    const personalStats = personalStatsMap.get(appId);
    const personalApiKeys = apiKeysByApp.get(appId) || [];
    const personalActivityData = personalActivityMap.get(appId) || [];
    const personalModelUsage = personalModelUsageMap.get(appId) || [];

    if (!globalStats || !personalStats) {
      console.error(`Missing stats for app ${appId}`);
      continue;
    }

    resultMap.set(appId, {
      // Spread global statistics
      ...globalStats,
      // Add personal statistics
      personalTotalRevenue: personalStats.personalTotalRevenue,
      personalTotalTokens: personalStats.personalTotalTokens,
      personalTotalInputTokens: personalStats.personalTotalInputTokens,
      personalTotalOutputTokens: personalStats.personalTotalOutputTokens,
      personalRecentTransactions: serializeTransactions(
        personalStats.recentTransactions
      ),
      personalModelUsage,
      personalActivityData,
      personalApiKeys,
    });
  }

  return resultMap;
}
