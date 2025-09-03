import { db } from '@/lib/db';
import { UserId } from './lib/schemas';

export const getUserFeed = async (userId: UserId) => {
  const result = await db.$queryRaw`
    SELECT 
      activity_hour,
      app,
      activity_type,
      total_count,
      total_profit,
      users
    FROM (
      SELECT 
        DATE_TRUNC('hour', t."createdAt") as activity_hour,
        JSON_BUILD_OBJECT(
          'id', t."echoAppId",
          'name', app.name,
          'profilePictureUrl', app."profilePictureUrl"
        ) as app,
        'transaction' as activity_type,
        COUNT(*) as total_count,
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
      
      UNION ALL
      
      SELECT 
        DATE_TRUNC('hour', rt."createdAt") as activity_hour,
        JSON_BUILD_OBJECT(
          'id', rt."echoAppId",
          'name', app.name,
          'profilePictureUrl', app."profilePictureUrl"
        ) as app,
        'signin' as activity_type,
        COUNT(*) as total_count,
        0 as total_profit,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'userId', rt."userId",
            'userName', u.name,
            'userProfilePicture', u.image
          )
        ) as users
      FROM refresh_tokens rt
      INNER JOIN app_memberships am ON rt."echoAppId" = am."echoAppId" 
        AND am."userId" = ${userId}::uuid
        AND am.role = 'owner'
        AND am."isArchived" = false
      INNER JOIN users u ON rt."userId" = u.id
      INNER JOIN echo_apps app ON rt."echoAppId" = app.id
      WHERE rt."isArchived" = false
      GROUP BY DATE_TRUNC('hour', rt."createdAt"), rt."echoAppId", app.name, app."profilePictureUrl"
    ) combined_activity
    ORDER BY activity_hour DESC, app->>'id'
    LIMIT 10
  `;

  return result;
};
