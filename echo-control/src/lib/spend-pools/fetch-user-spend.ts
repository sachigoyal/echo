import { Prisma } from '@/generated/prisma';
import { db } from '../db';
import { UserSpendInfo } from './types';

/**
 * Get complete user spend information for an app
 * @param userId - The user ID
 * @param appId - The echo app ID
 * @returns User spend information or null if not found
 */
export async function getUserSpendInfo(
  userId: string,
  appId: string
): Promise<UserSpendInfo | null> {
  // Find the spend pool for the app with user's usage
  const spendPool = await db.spendPool.findFirst({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    include: {
      userUsage: {
        where: {
          userId,
          isArchived: false,
        },
      },
    },
  });

  if (!spendPool || spendPool.userUsage.length === 0) {
    return {
      userId,
      echoAppId: appId,
      spendPoolId: null,
      amountSpent: 0,
      spendLimit: null,
      amountLeft: null,
    } as UserSpendInfo;
  }

  const userSpendPoolUsage = spendPool.userUsage[0];
  const amountSpent = Number(userSpendPoolUsage.totalSpent);
  const spendLimit = spendPool.perUserSpendLimit
    ? Number(spendPool.perUserSpendLimit)
    : null;
  const amountLeft = spendLimit ? spendLimit - amountSpent : null;

  return {
    userId,
    echoAppId: appId,
    spendPoolId: spendPool.id,
    amountSpent,
    spendLimit,
    amountLeft,
  } as UserSpendInfo;
}

export async function getGlobalUserSpendInfoForApp(
  echoAppId: string,
  tx?: Prisma.TransactionClient
): Promise<{
  spendPoolBalance: number;
  userSpendInfo: UserSpendInfo[];
}> {
  const client = tx ?? db;

  // Find the single spend pool for the app with user usage records
  const spendPool = await client.spendPool.findFirst({
    where: {
      echoAppId,
      isArchived: false,
    },
    include: {
      userUsage: {
        where: {
          isArchived: false,
        },
      },
    },
  });

  // If no spend pool exists, return empty array
  if (!spendPool) {
    return {
      spendPoolBalance: 0,
      userSpendInfo: [],
    };
  }

  const spendLimit = spendPool.perUserSpendLimit
    ? Number(spendPool.perUserSpendLimit)
    : null;

  // Convert user usage records to UserSpendInfo format
  const userSpendInfo = spendPool.userUsage.map(userUsage => {
    const amountSpent = Number(userUsage.totalSpent);
    const amountLeft = spendLimit ? spendLimit - amountSpent : null;

    return {
      userId: userUsage.userId,
      echoAppId,
      spendPoolId: spendPool.id,
      amountSpent,
      spendLimit,
      amountLeft,
    };
  });

  return {
    spendPoolBalance: Number(spendPool.totalSpent),
    userSpendInfo,
  };
}

export async function getGlobalUserSpendInfoForAppBatch(
  echoAppIds: string[],
  tx?: Prisma.TransactionClient
): Promise<
  Map<
    string,
    {
      spendPoolBalance: number;
      userSpendInfo: UserSpendInfo[];
    }
  >
> {
  const client = tx ?? db;

  // If no app IDs provided, return empty map
  if (echoAppIds.length === 0) {
    return new Map();
  }

  // Find spend pools for all specified apps with their user usage records
  const spendPools = await client.spendPool.findMany({
    where: {
      echoAppId: {
        in: echoAppIds,
      },
      isArchived: false,
    },
    include: {
      userUsage: {
        where: {
          isArchived: false,
        },
      },
    },
  });

  // Create result map
  const result = new Map<
    string,
    {
      spendPoolBalance: number;
      userSpendInfo: UserSpendInfo[];
    }
  >();

  // Initialize empty arrays for all requested apps
  for (const echoAppId of echoAppIds) {
    result.set(echoAppId, {
      spendPoolBalance: 0,
      userSpendInfo: [],
    });
  }

  // Process each spend pool (one per app)
  for (const spendPool of spendPools) {
    const spendLimit = spendPool.perUserSpendLimit
      ? Number(spendPool.perUserSpendLimit)
      : null;
    const spendPoolBalance =
      Number(spendPool.totalPaid) - Number(spendPool.totalSpent);
    // Convert user usage records to UserSpendInfo format
    const userSpendInfos = spendPool.userUsage.map(userUsage => {
      const amountSpent = Number(userUsage.totalSpent);
      const amountLeft = spendLimit ? spendLimit - amountSpent : null;

      return {
        userId: userUsage.userId,
        echoAppId: spendPool.echoAppId,
        spendPoolId: spendPool.id,
        amountSpent,
        spendLimit,
        amountLeft,
      };
    });

    // Add to result map
    result.set(spendPool.echoAppId, {
      spendPoolBalance,
      userSpendInfo: userSpendInfos,
    });
  }

  return result;
}
