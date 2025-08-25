import { z } from 'zod';

import { db } from '@/lib/db';

import { appSelect } from './lib/select';
import { AppRole } from '@/lib/permissions';
import { Prisma } from '@/generated/prisma';
import { paginationSchema, toPaginatedReponse } from '../lib/pagination';

export const getPublicAppSchema = z.uuid();

export const getPublicApp = async (
  appId: z.infer<typeof getPublicAppSchema>
) => {
  return await db.echoApp.findUnique({
    where: { id: appId },
    select: appSelect,
  });
};

export const getPublicAppMarkup = async (
  appId: z.infer<typeof getPublicAppSchema>
) => {
  return await db.markUp.findUnique({
    where: { echoAppId: appId },
    select: {
      amount: true,
    },
  });
};

export const listPublicAppsSchema = z.object({
  search: z.string().optional(),
});

export const listPublicApps = async (
  { search }: z.infer<typeof listPublicAppsSchema>,
  { page, page_size }: z.infer<typeof paginationSchema>
) => {
  const where: Prisma.EchoAppWhereInput = {
    isPublic: true,
    isArchived: false,
  };

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [apps, totalCount] = await Promise.all([
    db.echoApp.findMany({
      where,
      skip: page * page_size,
      take: page_size,
      select: appSelect,
    }),
    db.echoApp.count({
      where,
    }),
  ]);

  return toPaginatedReponse({
    items: apps,
    page,
    page_size,
    total_count: totalCount,
  });
};

export const getAppOwner = async (appId: string) => {
  const owner = await db.appMembership.findFirst({
    where: {
      echoAppId: appId,
      role: AppRole.OWNER,
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return owner?.user;
};
