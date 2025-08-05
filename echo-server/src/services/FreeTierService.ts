import { PrismaClient, SpendPool } from 'generated/prisma';
import { CreateLlmTransactionRequest } from '@zdql/echo-typescript-sdk/src/types';

class FreeTierService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Find all Free Spend Pools with available balance for a specific user in an app
   * Available balance means consumed = false AND user hasn't reached their spend limit
   * Ordered by remaining balance (highest first)
   */
  async getAvailableFreeSpendPoolsForUser(
    appId: string,
    userId: string
  ): Promise<SpendPool[]> {
    // Get all active spend pools for the app with their user usage data
    const spendPoolsWithUsage = await this.db.spendPool.findMany({
      where: {
        echoAppId: appId,
        isActive: true,
        isArchived: false,
      },
      include: {
        userUsage: {
          where: {
            userId: userId,
          },
        },
      },
    });

    // Filter and transform the results based on availability criteria
    const availablePools = spendPoolsWithUsage
      .filter(pool => {
        const userUsage = pool.userUsage[0]; // Should be at most one due to unique constraint

        if (!userUsage) {
          // Case 1: No usage record exists AND (pool has no limit OR limit > 0)
          return !pool.defaultSpendLimit || Number(pool.defaultSpendLimit) > 0;
        } else {
          // Case 2: Usage record exists AND user hasn't reached their limit
          return (
            userUsage.isActive &&
            (userUsage.effectiveSpendLimit === null ||
              Number(userUsage.totalSpent) <
                Number(userUsage.effectiveSpendLimit))
          );
        }
      })
      .map(pool => {
        const userUsage = pool.userUsage[0];
        // Calculate remaining balance for sorting
        // If no limit (null), use a very high number for sorting to prioritize unlimited pools
        const remainingBalance = userUsage
          ? Number(userUsage.effectiveSpendLimit) - Number(userUsage.totalSpent)
          : pool.defaultSpendLimit
            ? Number(pool.defaultSpendLimit)
            : Number.MAX_SAFE_INTEGER;

        // Remove the userUsage from the return object to match original SpendPool type
        const { userUsage: _, ...spendPoolData } = pool;
        return {
          ...spendPoolData,
          remainingBalance, // Temporary field for sorting
        };
      })
      .sort((a, b) => Number(b.remainingBalance) - Number(a.remainingBalance))
      .map(({ remainingBalance: _, ...pool }) => pool); // Remove temporary field

    return availablePools;
  }

  async getOrNoneFreeTierSpendPool(
    userId: string,
    appId: string
  ): Promise<SpendPool | null> {
    const availableSpendPools = await this.getAvailableFreeSpendPoolsForUser(
      appId,
      userId
    );

    if (availableSpendPools.length === 0) {
      return null;
    }

    return availableSpendPools[0] ?? null;
  }

  /**
   * Create a free tier transaction and update all related records atomically
   * 1. Create/update UserSpendPoolUsage with totalSpent
   * 2. Create LlmTransaction pointing at the free tier spend pool
   * 3. Update API key lastUsed (if apiKeyId provided)
   * 4. Update totalSpent on the SpendPool
   */
  async createFreeTierTransaction(
    userId: string,
    spendPoolId: string,
    transactionData: CreateLlmTransactionRequest & {
      echoAppId: string;
      apiKeyId?: string;
      markUpId?: string;
      githubLinkId?: string;
    }
  ) {
    return await this.db.$transaction(async tx => {
      // 1. Get the spend pool to determine effective limit
      const spendPool = await tx.spendPool.findUnique({
        where: { id: spendPoolId },
        select: { defaultSpendLimit: true },
      });

      if (!spendPool) {
        throw new Error('Spend pool not found');
      }

      // 2. Upsert UserSpendPoolUsage record
      const userSpendPoolUsage = await tx.userSpendPoolUsage.upsert({
        where: {
          userId_spendPoolId: {
            userId,
            spendPoolId,
          },
        },
        create: {
          userId,
          spendPoolId,
          effectiveSpendLimit: spendPool.defaultSpendLimit
            ? Number(spendPool.defaultSpendLimit)
            : null,
          totalSpent: transactionData.cost,
          isActive: true,
        },
        update: {
          totalSpent: {
            increment: transactionData.cost,
          },
        },
      });

      // 3. Create the LLM transaction
      const llmTransaction = await tx.llmTransaction.create({
        data: {
          model: transactionData.model,
          inputTokens: transactionData.inputTokens,
          providerId: transactionData.providerId,
          outputTokens: transactionData.outputTokens,
          totalTokens: transactionData.totalTokens,
          cost: transactionData.cost,
          prompt: transactionData.prompt || null,
          response: transactionData.response || null,
          status: transactionData.status || 'success',
          errorMessage: transactionData.errorMessage || null,
          userId,
          echoAppId: transactionData.echoAppId,
          apiKeyId: transactionData.apiKeyId || null,
          markUpId: transactionData.markUpId || null,
          githubLinkId: transactionData.githubLinkId || null,
          spendPoolId,
          userSpendPoolUsageId: userSpendPoolUsage.id,
        },
      });

      // 4. Update API key lastUsed if apiKeyId is provided
      if (transactionData.apiKeyId) {
        await tx.apiKey.update({
          where: { id: transactionData.apiKeyId },
          data: {
            lastUsed: new Date().toISOString(),
          },
        });
      }

      // 5. Update totalSpent on the SpendPool
      await tx.spendPool.update({
        where: { id: spendPoolId },
        data: {
          totalSpent: {
            increment: transactionData.cost,
          },
        },
      });

      return {
        llmTransaction,
        userSpendPoolUsage,
      };
    });
  }
}

export default FreeTierService;
