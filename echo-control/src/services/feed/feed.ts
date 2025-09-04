import { db } from '@/lib/db';
import { UserId } from '../lib/schemas';
import { FeedActivity } from './types';
import z from 'zod';
import {
  TimeBasedPaginationParams,
  toTimeBasedPaginatedReponse,
} from '../lib/pagination';

export const userFeedSchema = z.object({});

export const getUserFeed = async (
  userId: UserId,
  { cursor, limit }: TimeBasedPaginationParams
) => {
  const items = await db.$queryRaw<FeedActivity[]>`
    SELECT 
      timestamp,
      app,
      activity_type,
      event_data,
      users
    FROM (
      SELECT 
        timestamp,
        JSON_BUILD_OBJECT(
          'id', "echoAppId",
          'name', app_name,
          'profilePictureUrl', app_profile_picture
        ) as app,
        'transaction' as activity_type,
        JSON_BUILD_OBJECT(
          'total_transactions', total_transactions,
          'total_profit', total_profit
        ) as event_data,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'userId', "userId",
            'userName', user_name,
            'userProfilePicture', user_image
          )
        ) as users
      FROM (
        SELECT DISTINCT
          DATE_TRUNC('hour', t."createdAt") as timestamp,
          t."echoAppId",
          app.name as app_name,
          app."profilePictureUrl" as app_profile_picture,
          t."userId",
          u.name as user_name,
          u.image as user_image,
          transaction_stats.total_transactions,
          transaction_stats.total_profit
        FROM transactions t
        INNER JOIN app_memberships am ON t."echoAppId" = am."echoAppId" 
          AND am."userId" = ${userId}::uuid
          AND am.role = 'owner'
          AND am."isArchived" = false
        INNER JOIN users u ON t."userId" = u.id
        INNER JOIN echo_apps app ON t."echoAppId" = app.id
        INNER JOIN (
          SELECT 
            DATE_TRUNC('hour', t2."createdAt") as timestamp,
            t2."echoAppId",
            COUNT(*) as total_transactions,
            SUM(t2."markUpProfit") as total_profit
          FROM transactions t2
          INNER JOIN app_memberships am2 ON t2."echoAppId" = am2."echoAppId" 
            AND am2."userId" = ${userId}::uuid
            AND am2.role = 'owner'
            AND am2."isArchived" = false
          WHERE t2."isArchived" = false
            AND DATE_TRUNC('hour', t2."createdAt") < ${cursor}
          GROUP BY DATE_TRUNC('hour', t2."createdAt"), t2."echoAppId"
        ) transaction_stats ON DATE_TRUNC('hour', t."createdAt") = transaction_stats.timestamp 
          AND t."echoAppId" = transaction_stats."echoAppId"
        WHERE t."isArchived" = false
          AND DATE_TRUNC('hour', t."createdAt") < ${cursor}
      ) distinct_transactions
      GROUP BY timestamp, "echoAppId", app_name, app_profile_picture, total_transactions, total_profit
      
      UNION ALL
      
      SELECT 
        timestamp,
        JSON_BUILD_OBJECT(
          'id', "echoAppId",
          'name', app_name,
          'profilePictureUrl', app_profile_picture
        ) as app,
        'signin' as activity_type,
        JSON_BUILD_OBJECT(
          'total_users', COUNT(*)
        ) as event_data,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'userId', "userId",
            'userName', user_name,
            'userProfilePicture', user_image
          )
        ) as users
      FROM (
        SELECT DISTINCT
          DATE_TRUNC('hour', rt."createdAt") as timestamp,
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
          AND DATE_TRUNC('hour', rt."createdAt") < ${cursor}
      ) distinct_signins
      GROUP BY timestamp, "echoAppId", app_name, app_profile_picture
    ) combined_activity
    ORDER BY timestamp DESC, app->>'id'
    LIMIT ${limit + 1}
  `;

  return toTimeBasedPaginatedReponse({
    items,
    cursor,
    limit,
  });
};
