import { db } from '@/lib/db';
import { LlmTransactionMetadata, ModelUsage } from './types';
import { Prisma } from '@/generated/prisma';

/**
 * Get model usage statistics for an echo app
 * @param echoAppId - The ID of the echo app
 * @param userId - Optional user ID to filter transactions
 * @param tx - Optional Prisma transaction client
 * @returns Array of ModelUsage data aggregated by model
 */
export async function getModelUsage(
  echoAppId: string,
  userId?: string,
  tx?: Prisma.TransactionClient
): Promise<ModelUsage[]> {
  const client = tx || db;

  // Get all transactions for this app
  const transactions = await client.transaction.findMany({
    where: {
      echoAppId,
      isArchived: false,
      // Filter by user if provided
      ...(userId && { userId }),
    },
    select: {
      cost: true,
      metadata: true,
    },
  });

  // Aggregate usage by model
  const modelUsageMap = new Map<string, ModelUsage>();

  for (const transaction of transactions) {
    const metadata = transaction.metadata as unknown as LlmTransactionMetadata;

    if (metadata && metadata.model) {
      const model = String(metadata.model);

      // Get existing usage or initialize
      const existing = modelUsageMap.get(model) || {
        totalTokens: 0,
        totalModelCost: 0,
      };

      // Add token count
      if (metadata.totalTokens) {
        existing.totalTokens += Number(metadata.totalTokens);
      }

      // Add model cost
      // Model cost is typically stored in metadata, but fallback to transaction cost if not available
      let modelCost = 0;
      if (transaction.cost) {
        modelCost = Number(transaction.cost);
      }

      existing.totalModelCost += modelCost;

      // Update the map
      modelUsageMap.set(model, existing as ModelUsage);
    }
  }

  // Convert map to array and sort by total tokens (descending)
  const modelUsage: ModelUsage[] = Array.from(modelUsageMap.entries())
    .map(([model, usage]) => ({
      model,
      totalTokens: usage.totalTokens,
      totalModelCost: usage.totalModelCost,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  return modelUsage;
}

/**
 * Get model usage statistics for a specific time period
 * @param echoAppId - The ID of the echo app
 * @param startDate - Start date for the period
 * @param endDate - End date for the period
 * @param userId - Optional user ID to filter transactions
 * @param tx - Optional Prisma transaction client
 * @returns Array of ModelUsage data aggregated by model for the specified period
 */
export async function getModelUsageForPeriod(
  echoAppId: string,
  startDate: Date,
  endDate: Date,
  userId?: string,
  tx?: Prisma.TransactionClient
): Promise<ModelUsage[]> {
  const client = tx || db;

  // Get all transactions for this app within the time period
  const transactions = await client.transaction.findMany({
    where: {
      echoAppId,
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
      isArchived: false,
      // Filter by user if provided
      ...(userId && { userId }),
    },
    select: {
      cost: true,
      metadata: true,
    },
  });

  // Aggregate usage by model
  const modelUsageMap = new Map<string, ModelUsage>();

  for (const transaction of transactions) {
    const metadata = transaction.metadata as unknown as LlmTransactionMetadata;

    if (metadata && metadata.model) {
      const model = String(metadata.model);

      // Get existing usage or initialize
      const existing = modelUsageMap.get(model) || {
        totalTokens: 0,
        totalModelCost: 0,
      };

      // Add token count
      if (metadata.totalTokens) {
        existing.totalTokens += Number(metadata.totalTokens);
      }

      // Add model cost
      let modelCost = 0;
      if (transaction.cost) {
        modelCost = Number(transaction.cost);
      }

      existing.totalModelCost += modelCost;

      // Update the map
      modelUsageMap.set(model, existing as ModelUsage);
    }
  }

  // Convert map to array and sort by total tokens (descending)
  const modelUsage: ModelUsage[] = Array.from(modelUsageMap.entries())
    .map(([model, usage]) => ({
      model,
      totalTokens: usage.totalTokens,
      totalModelCost: usage.totalModelCost,
    }))
    .sort((a, b) => b.totalTokens - a.totalTokens);

  return modelUsage;
}

/**
 * Get the top N most used models for an echo app
 * @param echoAppId - The ID of the echo app
 * @param limit - Maximum number of models to return (default: 10)
 * @param userId - Optional user ID to filter transactions
 * @param tx - Optional Prisma transaction client
 * @returns Array of top N ModelUsage data
 */
export async function getTopModels(
  echoAppId: string,
  limit: number = 10,
  userId?: string,
  tx?: Prisma.TransactionClient
): Promise<ModelUsage[]> {
  const allModels = await getModelUsage(echoAppId, userId, tx);
  return allModels.slice(0, limit);
}

/**
 * Batch fetch model usage statistics for multiple echo apps
 * This is optimized to fetch all transactions in a single query
 * @param echoAppIds - Array of echo app IDs
 * @param userId - Optional user ID to filter transactions
 * @param tx - Optional Prisma transaction client
 * @returns Map of echo app ID to array of ModelUsage data
 */
export async function getModelUsageBatch(
  echoAppIds: string[],
  userId?: string,
  tx?: Prisma.TransactionClient
): Promise<Map<string, ModelUsage[]>> {
  const client = tx || db;

  // Get all transactions for all apps in a single query
  const allTransactions = await client.transaction.findMany({
    where: {
      echoAppId: { in: echoAppIds },
      isArchived: false,
      // Filter by user if provided
      ...(userId && { userId }),
    },
    select: {
      echoAppId: true,
      cost: true,
      metadata: true,
    },
  });

  // Initialize result map
  const usageMap = new Map<string, ModelUsage[]>();

  // Process each app
  for (const appId of echoAppIds) {
    // Filter transactions for this app
    const appTransactions = allTransactions.filter(
      tx => tx.echoAppId === appId
    );

    // Aggregate usage by model for this app
    const modelUsageMap = new Map<string, ModelUsage>();

    for (const transaction of appTransactions) {
      const metadata =
        transaction.metadata as unknown as LlmTransactionMetadata;

      if (metadata && metadata.model) {
        const model = String(metadata.model);

        // Get existing usage or initialize
        const existing = modelUsageMap.get(model) || {
          totalTokens: 0,
          totalModelCost: 0,
        };

        // Add token count
        if (metadata.totalTokens) {
          existing.totalTokens += Number(metadata.totalTokens);
        }

        // Add model cost
        let modelCost = 0;
        if (transaction.cost) {
          modelCost = Number(transaction.cost);
        }

        existing.totalModelCost += modelCost;

        // Update the map
        modelUsageMap.set(model, existing as ModelUsage);
      }
    }

    // Convert map to array and sort by total tokens (descending)
    const modelUsage: ModelUsage[] = Array.from(modelUsageMap.entries())
      .map(([model, usage]) => ({
        model,
        totalTokens: usage.totalTokens,
        totalModelCost: usage.totalModelCost,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens);

    usageMap.set(appId, modelUsage);
  }

  return usageMap;
}
