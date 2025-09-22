import z from 'zod';

import { db } from '@/services/db/client';
import { AppRole } from '@/services/db/ops/apps/permissions';

import type { Prisma } from '@/generated/prisma';

export const getFreeTierSpendPool = async (appId: string, userId: string) => {
  const spendPool = await db.spendPool.findFirst({
    where: {
      echoAppId: appId,
      isArchived: false,
      echoApp: {
        appMemberships: {
          some: {
            userId,
            role: AppRole.OWNER,
          },
        },
      },
    },
  });

  if (!spendPool) {
    return null;
  }

  return {
    ...spendPool,
    archivedAt: spendPool.archivedAt?.toISOString(),
    createdAt: spendPool.createdAt.toISOString(),
    updatedAt: spendPool.updatedAt.toISOString(),
    totalPaid: Number(spendPool.totalPaid),
    totalSpent: Number(spendPool.totalSpent),
    balance: Number(spendPool.totalPaid.minus(spendPool.totalSpent)),
    perUserSpendLimit: spendPool.perUserSpendLimit?.toNumber(),
  };
};

export const updateFreeTierSpendPoolSchema = z.object({
  perUserSpendLimit: z.number().positive(),
});

export const updateFreeTierSpendPool = async (
  appId: string,
  userId: string,
  input: z.infer<typeof updateFreeTierSpendPoolSchema>
) => {
  const parsedInput = updateFreeTierSpendPoolSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new Error('Invalid input');
  }

  // FROM JSON:
  // this is a bit of a hack because we are currently only allowing one spend pool per app
  // IMO the abstraction of updating by app ID is better than specifying the spend poolID in the input
  await db.spendPool.updateMany({
    where: {
      echoAppId: appId,
      echoApp: {
        appMemberships: {
          some: {
            userId,
            role: AppRole.OWNER,
          },
        },
      },
    },
    data: parsedInput.data,
  });
};

interface UpdateSpendPoolFromPaymentData {
  echoAppId: string;
  paymentId: string;
  amountInCents: number;
  metadata: Record<string, string>;
}

export async function updateSpendPoolFromPayment(
  tx: Prisma.TransactionClient,
  data: UpdateSpendPoolFromPaymentData
): Promise<void> {
  const { echoAppId, paymentId, amountInCents, metadata } = data;

  // Get or create the free tier spend pool for this app
  let spendPool = await tx.spendPool.findFirst({
    where: {
      echoAppId,
      isArchived: false,
    },
  });

  spendPool ??= await tx.spendPool.create({
    data: {
      name:
        metadata.poolName ??
        `Free Tier Credits - ${new Date().toISOString().split('T')[0]}`,
      description: 'Free tier credits pool for app users',
      totalPaid: 0, // Will be funded by payments
      echoAppId,
    },
  });

  // Fund the spend pool with this payment
  await tx.payment.update({
    where: { paymentId },
    data: {
      spendPoolId: spendPool.id,
    },
  });

  // Update the total amount in the spend pool
  await tx.spendPool.update({
    where: { id: spendPool.id },
    data: {
      totalPaid: {
        increment: amountInCents / 100,
      },
    },
  });

  // Set default spend limit if provided
  if (metadata?.defaultSpendLimit) {
    const defaultLimit = parseFloat(metadata.defaultSpendLimit);
    if (!isNaN(defaultLimit) && defaultLimit > 0) {
      console.log(
        `Default spend limit of $${defaultLimit} will be applied to new users for pool ${spendPool.id}`
      );
    }
  }
}
