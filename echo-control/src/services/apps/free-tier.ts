import { db } from '@/lib/db';
import { AppId } from './lib/schemas';
import { AppRole } from '@/lib/permissions';

export const getFreeTierSpendPool = async (appId: AppId, userId: string) => {
  return await db.spendPool.findFirst({
    where: {
      echoAppId: appId,
      isArchived: false,
      echoApp: {
        appMemberships: {
          some: {
            userId,
            role: AppRole.OWNER,
          },
        },
      },
    },
  });
};
