import { db } from '../db';
import { User, SpendPool } from '@/generated/prisma';

export interface CreateSpendPoolRequest {
  name: string;
  description?: string;
  totalAmount: number;
  echoAppId: string;
  defaultSpendLimit?: number;
}

export interface SpendPoolData {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  defaultSpendLimit?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSpendPoolRequest {
  name?: string;
  description?: string;
  defaultSpendLimit?: number;
}
/**
 * Internal function to fund a spend pool within an existing transaction
 */
export async function fundSpendPoolInternal(
  tx: any,
  spendPoolId: string,
  paymentId: string,
  amount: number
): Promise<void> {
  // Update the payment to link it to the spend pool
  await tx.payment.update({
    where: { id: paymentId },
    data: {
      spendPoolId,
    },
  });

  // Update the total amount in the spend pool
  await tx.spendPool.update({
    where: { id: spendPoolId },
    data: {
      totalAmount: {
        increment: amount,
      },
    },
  });
}

/**
 * Update spend pool balance from a payment within an existing transaction
 * @param tx - The database transaction
 * @param echoAppId - The app ID to create/fund the spend pool for
 * @param paymentRecord - The payment record
 * @param amountInCents - The payment amount in cents
 * @param metadata - Payment metadata containing pool configuration
 */
export async function updateSpendPoolFromPayment(
  tx: any,
  echoAppId: string,
  paymentRecord: any,
  amountInCents: number,
  metadata: Record<string, string>
): Promise<void> {
  // Get or create the free tier spend pool for this app
  const spendPool = await getOrCreateFreeTierSpendPoolInternal(
    tx,
    echoAppId,
    metadata?.poolName
  );

  // Fund the spend pool with this payment
  await fundSpendPoolInternal(
    tx,
    spendPool.id,
    paymentRecord.id,
    amountInCents / 100 // Convert from cents to dollars
  );

  console.log(
    `Free tier pool ${spendPool.id} funded with $${amountInCents / 100} from payment ${paymentRecord.id}`
  );

  // Set default spend limit if provided
  if (metadata?.defaultSpendLimit) {
    const defaultLimit = parseFloat(metadata.defaultSpendLimit);
    if (!isNaN(defaultLimit) && defaultLimit > 0) {
      // This will be applied to users when they access the app
      console.log(
        `Default spend limit of $${defaultLimit} will be applied to new users for pool ${spendPool.id}`
      );
    }
  }
}

/**
 * Get all spend pools for an app
 */
export async function getAppSpendPools(
  appId: string
): Promise<SpendPoolData[]> {
  const spendPools = await db.spendPool.findMany({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      totalAmount: true,
      defaultSpendLimit: true,
      totalSpent: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return spendPools.map(spendPool => {
    return {
      id: spendPool.id,
      name: spendPool.name,
      description: spendPool.description || undefined,
      totalAmount: Number(spendPool.totalAmount),
      spentAmount: Number(spendPool.totalSpent),
      remainingAmount:
        Number(spendPool.totalAmount) - Number(spendPool.totalSpent),
      defaultSpendLimit: spendPool.defaultSpendLimit
        ? Number(spendPool.defaultSpendLimit)
        : undefined,
      isActive: spendPool.isActive,
      createdAt: spendPool.createdAt,
      updatedAt: spendPool.updatedAt,
    };
  });
}
/**
 * Internal function to get or create a free tier spend pool within an existing transaction
 */
export async function getOrCreateFreeTierSpendPoolInternal(
  tx: any,
  appId: string,
  poolName?: string
): Promise<SpendPool> {
  // First try to find an existing free tier pool
  let spendPool = await tx.spendPool.findFirst({
    where: {
      echoAppId: appId,
      name: {
        contains: 'Free Tier',
      },
      isArchived: false,
    },
  });

  // If no free tier pool exists, create one
  if (!spendPool) {
    spendPool = await tx.spendPool.create({
      data: {
        name:
          poolName ||
          `Free Tier Credits - ${new Date().toISOString().split('T')[0]}`,
        description: 'Free tier credits pool for app users',
        totalAmount: 0, // Will be funded by payments
        echoAppId: appId,
      },
    });
  }

  return spendPool;
}

/**
 * Update a spend pool
 */
export async function updateSpendPool(
  spendPoolId: string,
  request: UpdateSpendPoolRequest
): Promise<SpendPool> {
  // Check if the spend pool exists
  const spendPool = await db.spendPool.findUnique({
    where: { id: spendPoolId },
  });

  if (!spendPool) {
    throw new Error('Spend pool not found');
  }

  // Update the spend pool and all userSpendPoolUsage in a transaction
  const [updatedSpendPool] = await db.$transaction([
    db.spendPool.update({
      where: { id: spendPoolId },
      data: request,
    }),
    db.userSpendPoolUsage.updateMany({
      where: { spendPoolId: spendPoolId },
      data: {
        effectiveSpendLimit: request.defaultSpendLimit,
      },
    }),
  ]);

  return updatedSpendPool;
}
