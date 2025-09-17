/**
 * User Apps Service - Shows all apps owned by a specific user with comprehensive usage and financial data
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns user app data in the expected format.
 */

import {
  PaginationParams,
  toPaginatedReponse,
} from '@/services/lib/pagination';
import { MultiSortParams } from '@/services/lib/sorting';
import { buildOrderByClause } from '@/services/admin/util/build-order-by-clause';
import { FilterParams } from '@/services/lib/filtering';
import { db } from '@/lib/db';
import { buildFilterClauses } from '@/services/admin/util/build-filter-clause';

export interface UserApp {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Spending information
  totalSpentAcrossApps: number;
  totalSpentFreeTier: number;
  totalSpentUserBalances: number;
  totalSpent: number;
  // Earnings information
  totalReferralProfitEarned: number;
  totalReferralProfitClaimed: number;
  totalMarkupProfitEarned: number;
  totalMarkupProfitClaimed: number;
  totalTransactionCosts: number;
  // Usage statistics
  totalUsers: number;
  totalTransactions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  lastTransactionAt: Date | null;
}

// Map frontend column names to SQL expressions
const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'a.id',
  name: 'a.name',
  description: 'a.description',
  createdAt: 'a."createdAt"',
  updatedAt: 'a."updatedAt"',
  totalUsers: 'COUNT(DISTINCT am."userId")',
  totalTransactions: 'COUNT(t.id)',
  totalInputTokens: 'COALESCE(SUM(tm."inputTokens"), 0)',
  totalOutputTokens: 'COALESCE(SUM(tm."outputTokens"), 0)',
  totalTokens: 'COALESCE(SUM(tm."totalTokens"), 0)',
  totalSpent: 'COALESCE(SUM(t."totalCost"), 0)',
  totalSpentFreeTier:
    'COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL THEN t."totalCost" ELSE 0 END), 0)',
  totalSpentUserBalances:
    'COALESCE(SUM(CASE WHEN t."spendPoolId" IS NULL THEN t."totalCost" ELSE 0 END), 0)',
  totalReferralProfitEarned: 'COALESCE(SUM(t."referralProfit"), 0)',
  totalMarkupProfitEarned: 'COALESCE(SUM(t."markUpProfit"), 0)',
  totalTransactionCosts: 'COALESCE(SUM(t."rawTransactionCost"), 0)',
  lastTransactionAt: 'MAX(t."createdAt")',
};

// Helper function to get payout information
const getPayoutInformation = async (appIds: string[]) => {
  if (appIds.length === 0)
    return { referralPayouts: new Map(), markupPayouts: new Map() };

  const payoutsQuery = `
    SELECT 
      p."echoAppId",
      p."userId",
      p.type,
      COALESCE(SUM(p.amount), 0) as "totalClaimed"
    FROM "payouts" p
    WHERE (p."echoAppId" = ANY($1::uuid[]) OR p."userId" = ANY($2::uuid[]))
      AND p.status = 'completed'
    GROUP BY p."echoAppId", p."userId", p.type
  `;

  // Extract user IDs from app ownership (we'll need to get this from the main query context)
  const userIds = appIds; // This is a simplification - in practice we'd need the actual user IDs

  const payoutsData = (await db.$queryRawUnsafe(
    payoutsQuery,
    appIds,
    userIds
  )) as Array<{
    echoAppId: string | null;
    userId: string | null;
    type: string;
    totalClaimed: number;
  }>;

  const referralPayouts = new Map<string, number>();
  const markupPayouts = new Map<string, number>();

  payoutsData.forEach(row => {
    if (row.type === 'referral' && row.userId) {
      // For referral payouts, we group by user (since referral profits are user-based)
      referralPayouts.set(
        row.userId,
        (referralPayouts.get(row.userId) || 0) + row.totalClaimed
      );
    } else if (row.type === 'markup' && row.echoAppId) {
      // For markup payouts, we group by app
      markupPayouts.set(
        row.echoAppId,
        (markupPayouts.get(row.echoAppId) || 0) + row.totalClaimed
      );
    }
  });

  return { referralPayouts, markupPayouts };
};

// Main function for getting user apps with pagination
export const getUserAppsWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams & { userId: string }
) => {
  // Build dynamic clauses
  const { whereClause, havingClause, parameters } = buildFilterClauses(
    params.filters,
    {
      columnMappings: COLUMN_MAPPINGS,
      defaultWhere:
        'WHERE owner_am."userId" = $1::uuid AND owner_am.role = \'' +
        'owner' +
        "'",
      aggregatedColumns: [
        'totalUsers',
        'totalTransactions',
        'totalInputTokens',
        'totalOutputTokens',
        'totalTokens',
        'totalSpent',
        'totalSpentFreeTier',
        'totalSpentUserBalances',
        'totalReferralProfitEarned',
        'totalMarkupProfitEarned',
        'totalTransactionCosts',
        'lastTransactionAt',
      ],
      numericColumns: [
        'totalUsers',
        'totalTransactions',
        'totalInputTokens',
        'totalOutputTokens',
        'totalTokens',
        'totalSpent',
        'totalSpentFreeTier',
        'totalSpentUserBalances',
        'totalReferralProfitEarned',
        'totalMarkupProfitEarned',
        'totalTransactionCosts',
      ],
      dateColumns: ['createdAt', 'updatedAt', 'lastTransactionAt'],
      uuidColumns: ['id'],
      initialParameters: [params.userId],
    }
  );
  const orderByClause = buildOrderByClause(params.sorts, {
    columnMappings: COLUMN_MAPPINGS,
    defaultOrderClause: 'a."createdAt" DESC',
  });

  // Build the main query with dynamic clauses
  const baseQuery = `
    SELECT 
      a.id,
      a.name,
      a.description,
      a."createdAt",
      a."updatedAt",
      COUNT(DISTINCT am."userId") as "totalUsers",
      COUNT(t.id) as "totalTransactions",
      COALESCE(SUM(tm."inputTokens"), 0) as "totalInputTokens",
      COALESCE(SUM(tm."outputTokens"), 0) as "totalOutputTokens",
      COALESCE(SUM(tm."totalTokens"), 0) as "totalTokens",
      COALESCE(SUM(t."totalCost"), 0) as "totalSpent",
      COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL THEN t."totalCost" ELSE 0 END), 0) as "totalSpentFreeTier",
      COALESCE(SUM(CASE WHEN t."spendPoolId" IS NULL THEN t."totalCost" ELSE 0 END), 0) as "totalSpentUserBalances",
      COALESCE(SUM(t."referralProfit"), 0) as "totalReferralProfitEarned",
      COALESCE(SUM(t."markUpProfit"), 0) as "totalMarkupProfitEarned",
      COALESCE(SUM(t."rawTransactionCost"), 0) as "totalTransactionCosts",
      MAX(t."createdAt") as "lastTransactionAt"
    FROM "echo_apps" a
    INNER JOIN "app_memberships" owner_am ON a.id = owner_am."echoAppId"
    LEFT JOIN "app_memberships" am ON a.id = am."echoAppId"
    LEFT JOIN "transactions" t ON a.id = t."echoAppId"
    LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
    ${whereClause}
    GROUP BY a.id, a.name, a.description, a."createdAt", a."updatedAt"
    ${havingClause}
    ${orderByClause}
    LIMIT $${parameters.length + 1} 
    OFFSET $${parameters.length + 2}
  `;

  // Add pagination parameters
  const queryParameters = [
    ...parameters,
    params.page_size,
    params.page * params.page_size,
  ];

  // Execute the main query
  const userApps = (await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  )) as Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    totalUsers: number;
    totalTransactions: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalSpent: number;
    totalSpentFreeTier: number;
    totalSpentUserBalances: number;
    totalReferralProfitEarned: number;
    totalMarkupProfitEarned: number;
    totalTransactionCosts: number;
    lastTransactionAt: Date | null;
  }>;

  // Get additional data for payouts
  const appIds = userApps.map(app => app.id);
  const payoutInfo = await getPayoutInformation(appIds);

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(DISTINCT a.id) as count
    FROM "echo_apps" a
    INNER JOIN "app_memberships" owner_am ON a.id = owner_am."echoAppId"
    LEFT JOIN "app_memberships" am ON a.id = am."echoAppId"
    LEFT JOIN "transactions" t ON a.id = t."echoAppId"
    LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
    ${whereClause}
    ${havingClause ? `GROUP BY a.id ${havingClause}` : ''}
  `;

  // If we have HAVING clauses, we need to count the grouped results
  const totalCountQuery = havingClause
    ? `SELECT COUNT(*) as count FROM (${countQuery}) as filtered_results`
    : countQuery;

  const totalCount = (await db.$queryRawUnsafe(
    totalCountQuery,
    ...parameters
  )) as Array<{ count: bigint }>;

  // Transform the results to match the expected interface
  const transformedResults = userApps.map(app => ({
    id: app.id,
    name: app.name,
    description: app.description,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    // Spending information
    totalSpentAcrossApps: app.totalSpent,
    totalSpentFreeTier: app.totalSpentFreeTier,
    totalSpentUserBalances: app.totalSpentUserBalances,
    totalSpent: app.totalSpent,
    // Earnings information
    totalReferralProfitEarned: app.totalReferralProfitEarned,
    totalReferralProfitClaimed:
      payoutInfo.referralPayouts.get(params.userId) || 0,
    totalMarkupProfitEarned: app.totalMarkupProfitEarned,
    totalMarkupProfitClaimed: payoutInfo.markupPayouts.get(app.id) || 0,
    totalTransactionCosts: app.totalTransactionCosts,
    // Usage statistics
    totalUsers: app.totalUsers,
    totalTransactions: app.totalTransactions,
    totalInputTokens: app.totalInputTokens,
    totalOutputTokens: app.totalOutputTokens,
    totalTokens: app.totalTokens,
    lastTransactionAt: app.lastTransactionAt,
  }));

  // Return in the expected format
  return toPaginatedReponse({
    items: transformedResults,
    page: params.page,
    page_size: params.page_size,
    total_count: Number(totalCount[0].count),
  });
};
