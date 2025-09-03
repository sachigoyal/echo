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
        activity_hour,
        JSON_BUILD_OBJECT(
          'id', "echoAppId",
          'name', app_name,
          'profilePictureUrl', app_profile_picture
        ) as app,
        'signin' as activity_type,
        COUNT(*) as total_count,
        0 as total_profit,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'userId', "userId",
            'userName', user_name,
            'userProfilePicture', user_image
          )
        ) as users
      FROM (
        SELECT DISTINCT
          DATE_TRUNC('hour', rt."createdAt") as activity_hour,
          rt."echoAppId",
          app.name as app_name,
          app."profilePictureUrl" as app_profile_picture,
          rt."userId",
          u.name as user_name,
          u.image as user_image
        FROM refresh_tokens rt
        INNER JOIN app_memberships am ON rt."echoAppId" = am."echoAppId" 
          AND am."userId" = ${userId}::uuid
          AND am.role = 'owner'
          AND am."isArchived" = false
        INNER JOIN users u ON rt."userId" = u.id
        INNER JOIN echo_apps app ON rt."echoAppId" = app.id
        WHERE rt."isArchived" = false
      ) distinct_signins
      GROUP BY activity_hour, "echoAppId", app_name, app_profile_picture
    ) combined_activity
    ORDER BY activity_hour DESC, app->>'id'
    LIMIT 10
  `;

  return result;
};
