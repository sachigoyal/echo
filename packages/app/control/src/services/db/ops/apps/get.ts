import { db } from '@/services/db/client';

import { appSelect } from './lib/select';
import type { AppId } from './lib/schemas';

import { AppRole } from '@/services/db/ops/apps/permissions';

export const getApp = async (appId: AppId) => {
  return await db.echoApp.findUnique({
    where: { id: appId, isArchived: false },
    select: appSelect,
  });
};

export const getAppOwner = async (appId: AppId) => {
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

export const getAppWithOwnerCheck = async (appId: AppId, userId: string) => {
  return await db.echoApp.findUnique({
    where: {
      id: appId,
      isArchived: false,
      appMemberships: {
        some: { userId, role: AppRole.OWNER, isArchived: false },
      },
    },
    select: appSelect,
  });
};
