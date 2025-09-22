import { db } from '@/services/db/client';

export const getApp = async (appId: string) => {
  const app = await db.echoApp.findUnique({
    where: { id: appId },
    select: {
      id: true,
      name: true,
      description: true,
      profilePictureUrl: true,
      createdAt: true,
      updatedAt: true,
      appMemberships: {
        select: {
          user: true,
        },
        where: {
          role: 'owner',
        },
      },
    },
  });
  return app;
};
