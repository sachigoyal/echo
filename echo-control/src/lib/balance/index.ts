import { db } from '../db';
import type { User, PrismaClient } from '@/generated/prisma';
import { BalanceResult } from './types';

/**
 * Get balance for a user, optionally for a specific app
 * @param user - The authenticated user
 * @param echoAppId - Optional app ID to get app-specific balance
 * @returns Balance information
 */
export async function getBalance(
  user: User,
  echoAppId?: string | null
): Promise<BalanceResult> {
  let balance: number;
  let totalPaid: number;
  let totalSpent: number;
  let echoAppName: string | null = null;

  if (echoAppId) {
    // App-specific balance: use User.totalPaid for credits and AppMembership.totalSpent for app spending
    const appMembership = await db.appMembership.findUnique({
      where: {
        userId_echoAppId: {
          userId: user.id,
          echoAppId: echoAppId,
        },
      },
      include: {
        user: true,
        echoApp: true,
      },
    });

    if (!appMembership) {
      throw new Error('App membership not found');
    }

    echoAppName = appMembership.echoApp?.name || null;
    totalPaid = Number(appMembership.user.totalPaid);
    totalSpent = Number(appMembership.totalSpent);
    balance = totalPaid - totalSpent;
  } else {
    // Overall balance: use User.totalPaid and User.totalSpent
    totalPaid = Number(user.totalPaid);
    totalSpent = Number(user.totalSpent);
    balance = totalPaid - totalSpent;
  }

  return {
    balance,
    totalPaid,
    totalSpent,
    currency: 'USD',
    echoAppId: echoAppId || null,
    echoAppName,
  };
}

/**
 * Update user balance from a payment within an existing transaction
 * @param tx - The database transaction
 * @param userId - The user ID to update
 * @param amountInCents - The payment amount in cents
 */
export async function updateUserBalanceFromPayment(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  userId: string,
  amountInCents: number
): Promise<void> {
  // Convert from cents to dollars and update user's totalPaid balance
  await tx.user.update({
    where: { id: userId },
    data: {
      totalPaid: {
        increment: amountInCents / 100,
      },
    },
  });
}

// Helper function to safely format currency
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  const numValue = Number(value);

  // Show <$0.01 for values greater than 0 but less than 0.01
  if (numValue > 0 && numValue < 0.01) {
    return '<$0.01';
  }

  return `$${numValue.toFixed(2)}`;
};
