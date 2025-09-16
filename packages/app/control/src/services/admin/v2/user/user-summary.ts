/**
 * User Summary Service - Provides high-level overview statistics for a single user
 * Combines earnings, spending, and app data into summary metrics for OverviewPanel
 */

import { db } from "@/lib/db"

export interface UserSummaryData {
  // User basic info
  userId: string
  userName: string | null
  userEmail: string
  userCreatedAt: Date
  
  // Earnings summary
  totalRevenue: number
  totalAppProfit: number
  totalMarkupProfit: number
  totalReferralProfit: number
  totalCompletedPayouts: number
  
  // Spending summary  
  totalSpent: number
  totalPaid: number
  balance: number
  freeTierUsage: number
  
  // App statistics
  totalApps: number
  totalUsers: number
  totalTransactions: number
  totalTokens: number
  
  // Activity metrics
  referralCodesGenerated: number
  referredUsersCount: number
  lastTransactionAt: Date | null
}

export const getUserSummary = async (userId: string): Promise<UserSummaryData> => {
  const query = `
    WITH user_earnings AS (
      SELECT 
        u.id,
        u.name,
        u.email,
        u."createdAt",
        COALESCE(SUM(t."totalCost"), 0) as "totalRevenue",
        COALESCE(SUM(t."appProfit"), 0) as "totalAppProfit",
        COALESCE(SUM(t."markUpProfit"), 0) as "totalMarkupProfit", 
        COALESCE(SUM(t."referralProfit"), 0) as "totalReferralProfit",
        COALESCE(SUM(p."amount") FILTER (WHERE p."status" = 'completed'), 0) as "totalCompletedPayouts"
      FROM "users" u
      LEFT JOIN "transactions" t ON u.id = t."userId"
      LEFT JOIN "payouts" p ON u.id = p."userId"
      WHERE u.id = $1::uuid
      GROUP BY u.id, u.name, u.email, u."createdAt"
    ),
    user_spending AS (
      SELECT 
        u.id,
        u."totalSpent",
        u."totalPaid",
        (u."totalPaid" - u."totalSpent") as "balance",
        COALESCE(SUM(uspu."totalSpent"), 0) as "freeTierUsage"
      FROM "users" u
      LEFT JOIN "user_spend_pool_usage" uspu ON u.id = uspu."userId"
      WHERE u.id = $1::uuid
      GROUP BY u.id, u."totalSpent", u."totalPaid"
    ),
    user_apps AS (
      SELECT 
        am."userId",
        COUNT(DISTINCT a.id) as "totalApps",
        COUNT(DISTINCT am_users.id) as "totalUsers",
        COUNT(DISTINCT t.id) as "totalTransactions",
        COALESCE(SUM(tm."inputTokens" + tm."outputTokens"), 0) as "totalTokens",
        MAX(t."createdAt") as "lastTransactionAt"
      FROM "app_memberships" am
      INNER JOIN "echo_apps" a ON am."echoAppId" = a.id
      LEFT JOIN "app_memberships" am_users ON a.id = am_users."echoAppId"
      LEFT JOIN "transactions" t ON a.id = t."echoAppId"
      LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
      WHERE am."userId" = $1::uuid AND am.role = 'owner'
      GROUP BY am."userId"
    ),
    user_referrals AS (
      SELECT 
        u.id,
        COUNT(DISTINCT rc.id) FILTER (WHERE rc."grantType" = 'referral') as "referralCodesGenerated",
        COUNT(DISTINCT am_referred.id) as "referredUsersCount"
      FROM "users" u
      LEFT JOIN "referral_codes" rc ON u.id = rc."userId"
      LEFT JOIN "app_memberships" am_referred ON rc.id = am_referred."referrerId"
      WHERE u.id = $1::uuid
      GROUP BY u.id
    )
    SELECT 
      ue.id as "userId",
      ue.name as "userName",
      ue.email as "userEmail", 
      ue."createdAt" as "userCreatedAt",
      ue."totalRevenue",
      ue."totalAppProfit",
      ue."totalMarkupProfit",
      ue."totalReferralProfit",
      ue."totalCompletedPayouts",
      us."totalSpent",
      us."totalPaid",
      us."balance",
      us."freeTierUsage",
      COALESCE(ua."totalApps", 0) as "totalApps",
      COALESCE(ua."totalUsers", 0) as "totalUsers",
      COALESCE(ua."totalTransactions", 0) as "totalTransactions",
      COALESCE(ua."totalTokens", 0) as "totalTokens",
      COALESCE(ur."referralCodesGenerated", 0) as "referralCodesGenerated",
      COALESCE(ur."referredUsersCount", 0) as "referredUsersCount",
      ua."lastTransactionAt"
    FROM user_earnings ue
    LEFT JOIN user_spending us ON ue.id = us.id
    LEFT JOIN user_apps ua ON ue.id = ua."userId"
    LEFT JOIN user_referrals ur ON ue.id = ur.id
  `

  const result = await db.$queryRawUnsafe(query, userId) as Array<{
    userId: string
    userName: string | null
    userEmail: string
    userCreatedAt: Date
    totalRevenue: number
    totalAppProfit: number
    totalMarkupProfit: number
    totalReferralProfit: number
    totalCompletedPayouts: number
    totalSpent: number
    totalPaid: number
    balance: number
    freeTierUsage: number
    totalApps: number
    totalUsers: number
    totalTransactions: number
    totalTokens: number
    referralCodesGenerated: number
    referredUsersCount: number
    lastTransactionAt: Date | null
  }>

  if (result.length === 0) {
    throw new Error(`User not found: ${userId}`)
  }

  return result[0]
}
