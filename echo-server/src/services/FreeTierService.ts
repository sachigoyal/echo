import {
  PrismaClient,
  SpendPool,
  UserSpendPoolUsage,
} from '../generated/prisma';
import { TransactionRequest } from '../types';
import { EchoDbService } from './DbService';

class FreeTierService {
  private readonly dbService: EchoDbService;

  constructor(private readonly db: PrismaClient) {
    this.dbService = new EchoDbService(db);
  }

  checkValidFreeTierSpendPool(
    spendPool: SpendPool & { userUsage: UserSpendPoolUsage[] }
  ): boolean {
    const spendPoolBalance =
      Number(spendPool.totalPaid) - Number(spendPool.totalSpent);
    const spendPoolHasBalance = spendPoolBalance > 0;

    const existingUserUsage: UserSpendPoolUsage | undefined =
      spendPool.userUsage[0] || undefined;

    if (!spendPoolHasBalance) {
      return false;
    }

    if (!existingUserUsage) {
      return true;
    }

    return this.checkExistingUserUsage(
      existingUserUsage,
      Number(spendPool.perUserSpendLimit) || null
    );
  }

  checkExistingUserUsage(
    userUsage: UserSpendPoolUsage,
    perUserSpendLimit: number | null
  ): boolean {
    if (!perUserSpendLimit) {
      return true;
    }

    if (perUserSpendLimit && Number(userUsage.totalSpent) < perUserSpendLimit) {
      return true;
    }

    return false;
  }

  async getOrNoneFreeTierSpendPool(
    appId: string,
    userId: string
  ): Promise<(SpendPool & { userUsage: UserSpendPoolUsage[] }) | null> {
    // First, find all non-archived spend pools for the app
    const spendPool = await this.db.spendPool.findFirst({
      where: {
        echoAppId: appId,
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

    if (!spendPool) {
      return null;
    }

    return this.checkValidFreeTierSpendPool(spendPool) ? spendPool : null;
  }
  /**
   * Create a free tier transaction and update all related records atomically
   * Delegates to DbService for shared transaction logic
   */
  async createFreeTierTransaction(
    transactionData: TransactionRequest,
    spendPoolId: string
  ) {
    // Delegate to the centralized DbService method
    return await this.dbService.createFreeTierTransaction(
      transactionData,
      spendPoolId
    );
  }
}

export default FreeTierService;
