import { db } from '@/lib/db';
import { UserId } from './lib/schemas';

export const getUserFeed = async (userId: UserId) => {
  const result = await db.$queryRaw`
    SELECT 
      t."userId",
      u.name as user_name,
      u.image as profile_picture,
      t."echoAppId",
      app.name as app_name,
      app."profilePictureUrl" as app_profile_picture,
      DATE_TRUNC('day', t."createdAt") as transaction_date,
      COUNT(*) as transaction_count
    FROM transactions t
    INNER JOIN app_memberships am ON t."echoAppId" = am."echoAppId" 
      AND am."userId" = ${userId}::uuid
      AND am.role = 'owner'
      AND am."isArchived" = false
    INNER JOIN users u ON t."userId" = u.id
    INNER JOIN echo_apps app ON t."echoAppId" = app.id
    WHERE t."isArchived" = false
    GROUP BY t."userId", u.name, u.image, t."echoAppId", app.name, app."profilePictureUrl", DATE_TRUNC('day', t."createdAt")
    ORDER BY transaction_date DESC, t."userId"
    LIMIT 10
  `;

  return result;
};
