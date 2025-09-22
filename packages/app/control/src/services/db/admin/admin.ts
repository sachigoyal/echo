import z from 'zod';

import type { mintCreditsToUserSchema } from '../credits/mint';
import { mintCreditsToUser } from '../credits/mint';

import { db } from '@/services/db/client';

import type { EchoApp, Prisma, User } from '@/generated/prisma';

import type { PaginationParams } from '../_lib/pagination';
import { toPaginatedReponse } from '../_lib/pagination';
import type {
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
  const where: Prisma.UserWhereInput = {
    creditGrantCodeUsages: {
      some: {
        creditGrantCode: {
          code,
        },
      },
    },
  };

  const [count, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        creditGrantCodeUsages: {
          where: {
            creditGrantCode: {
              code,
            },
          },
          select: {
            grantedAmount: true,
          },
        },
      },
    }),
  ]);

  return toPaginatedReponse({
    items: users.map(user => ({
      ...user,
      creditGrantCodeUsages: user.creditGrantCodeUsages.map(usage => ({
        ...usage,
        grantedAmount: usage.grantedAmount.toNumber(),
      })),
    })),
    page: pagination.page,
    page_size: pagination.page_size,
    total_count: count,
  });
}

export async function adminUpdateCreditGrant({
  id,
  ...data
}: z.infer<typeof adminUpdateCreditGrantSchema>) {
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
      user.name ?? '',
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
