import { PrismaClient, SpendPool, UserSpendPoolUsage } from 'generated/prisma';
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
    const spendPoolsWithUsage = await this.fetchActiveSpendPoolsWithUsage(
      appId,
      userId
    );

    const availablePools = spendPoolsWithUsage
      .filter(pool => this.isPoolAvailableForUser(pool))
      .map(pool => this.calculatePoolWithRemainingBalance(pool))
      .sort(this.sortByRemainingBalanceDescending)
      .map(this.removeTemporaryFields);

    return availablePools;
  }

  private async fetchActiveSpendPoolsWithUsage(
    appId: string,
    userId: string
  ): Promise<(SpendPool & { userUsage: UserSpendPoolUsage[] })[]> {
    return await this.db.spendPool.findMany({
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
  }

  private isPoolAvailableForUser(
    pool: SpendPool & { userUsage: UserSpendPoolUsage[] }
  ): boolean {
    const userUsage = pool.userUsage[0]; // At most one due to unique constraint

    if (!userUsage) {
      return this.isNewUserEligibleForPool(pool);
    }

    return this.hasUserRemainingBalance(userUsage);
  }

  private isNewUserEligibleForPool(
    pool: SpendPool & { userUsage: UserSpendPoolUsage[] }
  ): boolean {
    // New users can use pools that have no limit or a positive limit
    const hasNoLimit = !pool.defaultSpendLimit;
    const hasPositiveLimit = Number(pool.defaultSpendLimit) > 0;

    return hasNoLimit || hasPositiveLimit;
  }

  private hasUserRemainingBalance(userUsage: UserSpendPoolUsage): boolean {
    if (!userUsage.isActive) {
      return false;
    }

    const hasUnlimitedSpend = userUsage.effectiveSpendLimit === null;
    const hasRemainingCredit =
      Number(userUsage.totalSpent) < Number(userUsage.effectiveSpendLimit);

    return hasUnlimitedSpend || hasRemainingCredit;
  }

  private calculatePoolWithRemainingBalance(
    pool: SpendPool & { userUsage: UserSpendPoolUsage[] }
  ): SpendPool & { remainingBalance: number } {
    const userUsage = pool.userUsage[0];
    const remainingBalance = this.calculateRemainingBalance(pool, userUsage);

    // Remove userUsage from the return object to match SpendPool type
    const { userUsage: _, ...spendPoolData } = pool;

    return {
      ...spendPoolData,
      remainingBalance, // Temporary field for sorting
    };
  }

  private calculateRemainingBalance(pool: any, userUsage: any): number {
    if (userUsage) {
      // User has existing usage - calculate remaining from their effective limit
      const effectiveLimit = userUsage.effectiveSpendLimit;
      const totalSpent = userUsage.totalSpent;

      return effectiveLimit === null
        ? Number.MAX_SAFE_INTEGER // Unlimited
        : Number(effectiveLimit) - Number(totalSpent);
    }

    // New user - use the pool's default limit
    return pool.defaultSpendLimit === null
      ? Number.MAX_SAFE_INTEGER // Unlimited
      : Number(pool.defaultSpendLimit);
  }

  private sortByRemainingBalanceDescending(a: any, b: any): number {
    return Number(b.remainingBalance) - Number(a.remainingBalance);
  }

  private removeTemporaryFields(pool: any): any {
    const { remainingBalance: _, ...cleanPool } = pool;
    return cleanPool;
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
