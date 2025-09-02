import { db } from '@/lib/db';

/**
 * Standard where clause to filter out archived records
 */
export const withoutArchived = {
  isArchived: false,
};

/**
 * Soft delete an echo app and all its related records
 */
export async function softDeleteEchoApp(appId: string) {
  const now = new Date();

  // Archive related API keys
  await db.apiKey.updateMany({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    data: {
      isArchived: true,
      archivedAt: now,
    },
  });

  // Archive related transactions
  await db.transaction.updateMany({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    data: {
      isArchived: true,
      archivedAt: now,
    },
  });

  // Archive related refresh tokens
  await db.refreshToken.updateMany({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    data: {
      isArchived: true,
      archivedAt: now,
    },
  });

  // Archive related app sessions
  await db.appSession.updateMany({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    data: {
      isArchived: true,
      revokedAt: now,
      updatedAt: now,
    },
  });

  // Archive related app memberships
  await db.appMembership.updateMany({
    where: {
      echoAppId: appId,
      isArchived: false,
    },
    data: {
      isArchived: true,
      archivedAt: now,
    },
  });

  // Finally archive the app itself
  return await db.echoApp.update({
    where: { id: appId },
    data: {
      isArchived: true,
      archivedAt: now,
    },
  });
}
