import { z } from 'zod';

import { db } from '@/lib/db';
import { paginationParamsSchema } from '@/lib/pagination';

import { appSelect } from './lib/select';
import { AppRole } from '@/lib/permissions';

export const getPublicAppSchema = z.uuid();

export const getPublicApp = async (
  appId: z.infer<typeof getPublicAppSchema>
) => {
  return await db.echoApp.findUnique({
    where: { id: appId },
    select: appSelect,
  });
};

export const listPublicAppsSchema = paginationParamsSchema.extend({
  search: z.string().optional(),
});

export const listPublicApps = async ({
  page,
  page_size,
  search,
}: z.infer<typeof listPublicAppsSchema>) => {
  return await db.echoApp.findMany({
    where: {
      isPublic: true,
      isArchived: false,
      name: { contains: search, mode: 'insensitive' },
    },
    skip: page * page_size,
    take: page_size,
    select: appSelect,
    orderBy: {
      createdAt: 'desc',
    },
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
