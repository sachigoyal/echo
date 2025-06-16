import { db } from '../db';
import { User } from '@/generated/prisma';

export interface BalanceResult {
  balance: number;
  totalPaid: number;
  totalSpent: number;
  currency: string;
  echoAppId: string | null;
  echoAppName: string | null;
}

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
