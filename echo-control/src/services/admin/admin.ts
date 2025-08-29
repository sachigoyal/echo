import z from 'zod';

import { mintCreditsToUser, mintCreditsToUserSchema } from '../credits';

import { db } from '@/lib/db';

import { ReferralCodeType } from '@/lib/referral-codes/types';

import type { EchoApp, User } from '@/generated/prisma';

import {
  getUserEarningsAggregates,
  getAppTransactionAggregates,
  getAllUsersEarningsAggregates,
  getAppEarningsAcrossAllUsers,
  type UserEarningsAggregates,
  type AppTransactionAggregates,
  type GlobalEarningsAggregates,
} from './user-earnings';

import {
  getUserSpendingAggregates,
  getAppSpendingAggregates,
  getAllUsersSpendingAggregates,
  getAppSpendingAcrossAllUsers,
  type UserSpendingAggregates,
  type AppSpendingAggregates,
  type GlobalSpendingAggregates,
} from './user-spending';

import {
  getAppTransactionsPaginated,
  getAppTransactionTotals,
  type AppTransactionDetail,
  type AppTransactionsPaginated,
  type AppTransactionTotals,
} from './app-transactions';

import {
  getUserTransactionsPaginated,
  getUserTransactionTotals,
  type UserTransactionDetail,
  type UserTransactionsPaginated,
  type UserTransactionTotals,
} from './user-transactions';

export async function adminGetUsers(): Promise<User[]> {
  return await db.user.findMany();
}

export async function adminGetAppsForUser(userId: string): Promise<EchoApp[]> {
  return await db.echoApp.findMany({
    where: {
      appMemberships: {
        some: {
          userId: userId,
          role: 'owner',
        },
      },
    },
  });
}

export async function adminMintCreditsToUser(
  input: z.infer<typeof mintCreditsToUserSchema>
) {
  return await mintCreditsToUser(input);
}

export const adminMintCreditReferralCodeSchema = z.object({
  amountInDollars: z.number().positive('Amount must be positive'),
  expiresAt: z
    .date()
    .optional()
    .default(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
});

export async function adminMintCreditReferralCode(
  input: z.infer<typeof adminMintCreditReferralCodeSchema>
) {
  const code = crypto.randomUUID();

  const { amountInDollars, expiresAt } = input;

  const referralCode = await db.referralCode.create({
    data: {
      code,
      echoAppId: null,
      grantType: ReferralCodeType.CREDITS,
      grantAmount: amountInDollars,
      reusable: false,
      expiresAt,
    },
  });

  return {
    code: referralCode.code,
    grantAmount: referralCode.grantAmount,
    expiresAt: referralCode.expiresAt,
  };
}

// Export user earnings aggregation functions
export {
  getUserEarningsAggregates,
  getAppTransactionAggregates,
  getAllUsersEarningsAggregates,
  getAppEarningsAcrossAllUsers,
  type UserEarningsAggregates,
  type AppTransactionAggregates,
  type GlobalEarningsAggregates,
};

// Export user spending aggregation functions
export {
  getUserSpendingAggregates,
  getAppSpendingAggregates,
  getAllUsersSpendingAggregates,
  getAppSpendingAcrossAllUsers,
  type UserSpendingAggregates,
  type AppSpendingAggregates,
  type GlobalSpendingAggregates,
};

// Export app transaction detail functions
export {
  getAppTransactionsPaginated,
  getAppTransactionTotals,
  type AppTransactionDetail,
  type AppTransactionsPaginated,
  type AppTransactionTotals,
};

// Export user transaction detail functions
export {
  getUserTransactionsPaginated,
  getUserTransactionTotals,
  type UserTransactionDetail,
  type UserTransactionsPaginated,
  type UserTransactionTotals,
};
