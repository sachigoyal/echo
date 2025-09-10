import z from 'zod';

import { mintCreditsToUser, mintCreditsToUserSchema } from '../credits';

import { db } from '@/lib/db';

import { ReferralCodeType } from '@/lib/referral-codes/types';

import type { EchoApp, User } from '@/generated/prisma';

import {
  getUserEarningsAggregates,
  getAppTransactionAggregates,
  getAllUsersEarningsAggregates,
  getAllUsersEarningsAggregatesPaginated,
  getAppEarningsAcrossAllUsers,
} from './user-earnings';

import {
  getUserSpendingAggregates,
  getAppSpendingAggregates,
  getAllUsersSpendingAggregates,
  getAllUsersSpendingAggregatesPaginated,
  getAppSpendingAcrossAllUsers,
} from './user-spending';

import {
  getAppTransactionsPaginated,
  getAppTransactionTotals,
} from './app-transactions';

import {
  getUserTransactionsPaginated,
  getUserTransactionTotals,
} from './user-transactions';

export const isAdmin = async (userId: string) => {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  return user?.admin;
};

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
  getAllUsersEarningsAggregatesPaginated,
  getAppEarningsAcrossAllUsers,
};

// Export user spending aggregation functions
export {
  getUserSpendingAggregates,
  getAppSpendingAggregates,
  getAllUsersSpendingAggregates,
  getAllUsersSpendingAggregatesPaginated,
  getAppSpendingAcrossAllUsers,
};

// Export app transaction detail functions
export { getAppTransactionsPaginated, getAppTransactionTotals };

// Export user transaction detail functions
export { getUserTransactionsPaginated, getUserTransactionTotals };
