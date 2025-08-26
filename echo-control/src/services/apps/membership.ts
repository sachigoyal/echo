import { db } from '@/lib/db';
import { appSelect } from './lib/select';
import { AppRole, MembershipStatus } from '@/lib/permissions';

import { AppId } from './lib/schemas';

export const getAppMembership = async (userId: string, appId: AppId) => {
  return await db.appMembership.findUnique({
    where: {
      userId_echoAppId: {
        userId,
        echoAppId: appId,
      },
    },
    select: {
      role: true,
      status: true,
      echoApp: {
        select: appSelect,
      },
    },
  });
};

// this will succeed whether creating a new membership or if the user is already a member
export const createAppMembership = async (userId: string, echoAppId: AppId) => {
  return db.appMembership.upsert({
    where: {
      userId_echoAppId: {
        userId,
        echoAppId,
      },
    },
    create: {
      userId,
      echoAppId,
      role: AppRole.CUSTOMER,
      status: MembershipStatus.ACTIVE,
      totalSpent: 0,
    },
    update: {
      // Don't update any fields if the membership already exists
    },
  });
};
