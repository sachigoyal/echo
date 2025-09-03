import { db } from '@/lib/db';
import { UserId } from './lib/schemas';

export const getUserFeed = async (userId: UserId) => {
  const result = await db.$queryRaw`
    SELECT 
      DATE_TRUNC('hour', t."createdAt") as transaction_hour,
      JSON_BUILD_OBJECT(
        'id', t."echoAppId",
        'name', app.name,
        'profilePictureUrl', app."profilePictureUrl"
      ) as app,
      COUNT(*) as total_transaction_count,
      SUM(t."markUpProfit") as total_profit,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'userId', t."userId",
          'userName', u.name,
          'userProfilePicture', u.image
        )
      ) as users
    FROM transactions t
    INNER JOIN app_memberships am ON t."echoAppId" = am."echoAppId" 
      AND am."userId" = ${userId}::uuid
      AND am.role = 'owner'
      AND am."isArchived" = false
    INNER JOIN users u ON t."userId" = u.id
    INNER JOIN echo_apps app ON t."echoAppId" = app.id
    WHERE t."isArchived" = false
    GROUP BY DATE_TRUNC('hour', t."createdAt"), t."echoAppId", app.name, app."profilePictureUrl"
    ORDER BY transaction_hour DESC, t."echoAppId"
    LIMIT 10
  `;

  return result;
};
