import z from 'zod';

import { mintCreditsToUser, mintCreditsToUserSchema } from '../credits/mint';

import { db } from '@/lib/db';

import type { EchoApp, Prisma, User } from '@/generated/prisma';

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
import { PaginationParams, toPaginatedReponse } from '../lib/pagination';
import {
  adminCreateCreditGrantSchema,
  adminUpdateCreditGrantSchema,
} from './schemas';

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

export const adminGetCreditGrantSchema = z.object({
  code: z.string(),
});

export const adminGetCreditGrant = async (
  input: z.infer<typeof adminGetCreditGrantSchema>
) => {
  const creditGrant = await db.creditGrantCode.findUnique({
    where: { code: input.code },
  });

  if (!creditGrant) {
    return null;
  }

  return {
    ...creditGrant,
    grantAmount: creditGrant.grantAmount.toNumber(),
  };
};

export async function adminCreateCreditGrant(
  input: z.infer<typeof adminCreateCreditGrantSchema>
) {
  const code = crypto.randomUUID();

  return await db.creditGrantCode.create({
    data: {
      code,
      ...input,
    },
  });
}

export async function adminListCreditGrants(pagination: PaginationParams) {
  const where: Prisma.CreditGrantCodeWhereInput = {
    isArchived: false,
  };
  const [count, creditGrants] = await Promise.all([
    db.creditGrantCode.count({ where }),
    db.creditGrantCode.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: pagination.page_size,
      skip: pagination.page * pagination.page_size,
      where,
    }),
  ]);

  return toPaginatedReponse({
    items: creditGrants.map(creditGrant => ({
      ...creditGrant,
      grantAmount: creditGrant.grantAmount.toNumber(),
    })),
    page: pagination.page,
    page_size: pagination.page_size,
    total_count: count,
  });
}

export const adminListCreditGrantUsagesSchema = z.object({
  code: z.string(),
});

export async function adminListCreditGrantUsages(
  { code }: z.infer<typeof adminListCreditGrantUsagesSchema>,
  pagination: PaginationParams
) {
  const [creditGrantUsages] = await Promise.all([
    db.creditGrantCodeUsage.groupBy({
      by: ['userId'],
      where: {
        creditGrantCode: {
          code,
        },
      },
      _count: {
        userId: true,
        _all: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: pagination.page_size,
      skip: pagination.page * pagination.page_size,
    }),
  ]);

  db.user.findMany({
    where: {
      creditGrantCodeUsages: {},
    },
  });

  return toPaginatedReponse({
    items: creditGrantUsages,
    page: pagination.page,
    page_size: pagination.page_size,
    total_count: creditGrantUsages[0]._count._all,
  });
}

export async function adminUpdateCreditGrant({
  id,
  ...data
}: z.infer<typeof adminUpdateCreditGrantSchema>) {
  console.log(data);
  return await db.creditGrantCode.update({
    where: { id },
    data,
  });
}

export const downloadUsersCsvSchema = z.object({
  createdAfter: z.date(),
});

export async function downloadUsersCsv(
  input: z.infer<typeof downloadUsersCsvSchema>
) {
  const users = await db.user.findMany({
    where: {
      createdAt: {
        gte: input.createdAfter,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const csvData = [
    ['ID', 'Name', 'Email', 'Created At'],
    ...users.map(user => [
      user.id,
      user.name || '',
      user.email,
      user.createdAt.toISOString(),
    ]),
  ];

  const csvString = csvData
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return {
    csvString,
    filename: `users-created-after-${input.createdAfter.toISOString().split('T')[0]}.csv`,
    userCount: users.length,
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
