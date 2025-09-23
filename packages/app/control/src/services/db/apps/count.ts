import { db } from '@/services/db/client';

import type { Prisma } from '@/generated/prisma';
import { AppRole } from '@/services/db/apps/permissions';

export const countApps = async (where: Prisma.EchoAppWhereInput) => {
  return await db.echoApp.count({
    where,
  });
};

export const countPublicApps = async () => {
  return await db.echoApp.count({
    where: {
      isPublic: true,
      isArchived: false,
    },
  });
};

export const countMemberApps = async (userId: string) => {
  return await db.echoApp.count({
    where: {
      appMemberships: { some: { userId, status: 'active' } },
    },
  });
};

export const countOwnerApps = async (userId: string) => {
  return await db.echoApp.count({
    where: {
      appMemberships: {
        some: { userId, status: 'active', role: AppRole.OWNER },
      },
    },
  });
};
