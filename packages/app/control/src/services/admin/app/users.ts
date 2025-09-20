/**
 * App Users Service - Shows users of a specific app with their token usage and spending
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns app user data in the expected format.
 */

import type { PaginationParams } from '@/services/lib/pagination';
import { toPaginatedReponse } from '@/services/lib/pagination';
import type { MultiSortParams } from '@/services/lib/sorting';
import { buildOrderByClause } from '@/services/admin/util/build-order-by-clause';
import type { FilterParams } from '@/services/lib/filtering';
import { db } from '@/services/db/client';
import { buildFilterClauses } from '@/services/admin/util/build-filter-clause';

interface AppUsersRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  totalPaid: number;
  userTotalSpent: number;
  membershipRole: string;
  membershipStatus: string;
  membershipTotalSpent: number;
  membershipCreatedAt: Date;
  totalTransactions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalSpent: number;
  totalAppProfit: number;
  totalMarkupProfit: number;
  totalReferralProfit: number;
  lastTransactionAt: Date;
}

// Map frontend column names to SQL expressions
const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'u.id',
  name: 'u.name',
  email: 'u.email',
  createdAt: 'u."createdAt"',
  updatedAt: 'u."updatedAt"',
  // Membership columns (primary keys)
  membershipRole: 'am.role',
  membershipStatus: 'am.status',
  membershipTotalSpent: 'am."totalSpent"',
  membershipCreatedAt: 'am."createdAt"',
  // Membership columns (dot-notation aliases from frontend)
  'membership.role': 'am.role',
  'membership.status': 'am.status',
  'membership.totalSpent': 'am."totalSpent"',
  'membership.createdAt': 'am."createdAt"',
  // Membership columns (snake_case aliases)
  membership_role: 'am.role',
  membership_status: 'am.status',
  membership_total_spent: 'am."totalSpent"',
  membership_created_at: 'am."createdAt"',
  // Transaction aggregates
  totalTransactions: 'COALESCE(tx."totalTransactions", 0)',
  totalInputTokens: 'COALESCE(tx."totalInputTokens", 0)',
  totalOutputTokens: 'COALESCE(tx."totalOutputTokens", 0)',
  totalTokens: 'COALESCE(tx."totalTokens", 0)',
  totalSpent: 'COALESCE(tx."totalSpent", 0)',
  totalAppProfit: 'COALESCE(tx."totalAppProfit", 0)',
  totalMarkupProfit: 'COALESCE(tx."totalMarkupProfit", 0)',
  totalReferralProfit: 'COALESCE(tx."totalReferralProfit", 0)',
  lastTransactionAt: 'tx."lastTransactionAt"',
};

// Use shared builder with optional appId parameter as initial parameter

// Main function for getting app users with pagination
export const getAppUsersWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams & { appId: string }
) => {
  // Build dynamic clauses
  const { whereClause, havingClause, parameters } = buildFilterClauses(
    params.filters,
    {
      columnMappings: COLUMN_MAPPINGS,
      defaultWhere: params.appId
        ? 'WHERE am."echoAppId" = $1::uuid'
        : 'WHERE 1=1',
      aggregatedColumns: [
        'totalTransactions',
        'totalInputTokens',
        'totalOutputTokens',
        'totalTokens',
        'totalSpent',
        'totalAppProfit',
        'totalMarkupProfit',
        'totalReferralProfit',
        'lastTransactionAt',
      ],
      numericColumns: [
        'totalTransactions',
        'totalInputTokens',
        'totalOutputTokens',
        'totalTokens',
        'totalSpent',
        'totalAppProfit',
        'totalMarkupProfit',
        'totalReferralProfit',
        'membershipTotalSpent',
        'membership.totalSpent',
        'membership_total_spent',
      ],
      dateColumns: [
        'createdAt',
        'updatedAt',
        'membershipCreatedAt',
        'membership.createdAt',
        'membership_created_at',
        'lastTransactionAt',
      ],
      uuidColumns: ['id'],
      initialParameters: params.appId ? [params.appId] : [],
    }
  );
  const orderByClause = buildOrderByClause(params.sorts, {
    columnMappings: COLUMN_MAPPINGS,
    defaultOrderClause: 'u."createdAt" DESC',
  });

  // Build the main query with dynamic clauses
  const baseQuery = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u."createdAt",
      u."updatedAt",
      u."totalPaid",
      u."totalSpent" as "userTotalSpent",
      am.role as "membershipRole",
      am.status as "membershipStatus",
      am."totalSpent" as "membershipTotalSpent",
      am."createdAt" as "membershipCreatedAt",
      COALESCE(tx."totalTransactions", 0) as "totalTransactions",
      COALESCE(tx."totalInputTokens", 0) as "totalInputTokens",
      COALESCE(tx."totalOutputTokens", 0) as "totalOutputTokens",
      COALESCE(tx."totalTokens", 0) as "totalTokens",
      COALESCE(tx."totalSpent", 0) as "totalSpent",
      COALESCE(tx."totalAppProfit", 0) as "totalAppProfit",
      COALESCE(tx."totalMarkupProfit", 0) as "totalMarkupProfit",
      COALESCE(tx."totalReferralProfit", 0) as "totalReferralProfit",
      tx."lastTransactionAt" as "lastTransactionAt"
    FROM "users" u
    INNER JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) as "totalTransactions",
        COALESCE(SUM(tm."inputTokens"), 0) as "totalInputTokens",
        COALESCE(SUM(tm."outputTokens"), 0) as "totalOutputTokens",
        COALESCE(SUM(tm."totalTokens"), 0) as "totalTokens",
        COALESCE(SUM(t."totalCost"), 0) as "totalSpent",
        COALESCE(SUM(t."appProfit"), 0) as "totalAppProfit",
        COALESCE(SUM(t."markUpProfit"), 0) as "totalMarkupProfit",
        COALESCE(SUM(t."referralProfit"), 0) as "totalReferralProfit",
        MAX(t."createdAt") as "lastTransactionAt"
      FROM "transactions" t
      LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
      WHERE t."userId" = u.id AND t."echoAppId" = am."echoAppId"
    ) tx ON TRUE
    ${whereClause}
    GROUP BY 
      u.id, u.name, u.email, u."createdAt", u."updatedAt", u."totalPaid", u."totalSpent",
      am.role, am.status, am."totalSpent", am."createdAt",
      tx."totalTransactions", tx."totalInputTokens", tx."totalOutputTokens", tx."totalTokens",
      tx."totalSpent", tx."totalAppProfit", tx."totalMarkupProfit", tx."totalReferralProfit",
      tx."lastTransactionAt"
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
  const appUsers = await db.$queryRawUnsafe<AppUsersRow[]>(
    baseQuery,
    ...queryParameters
  );

  // Build count query with same filters
  const countSourceQuery = `
    SELECT 
      u.id,
      am.role as "membershipRole",
      am.status as "membershipStatus",
      am."totalSpent" as "membershipTotalSpent",
      am."createdAt" as "membershipCreatedAt",
      COALESCE(tx."totalTransactions", 0) as "totalTransactions",
      COALESCE(tx."totalInputTokens", 0) as "totalInputTokens",
      COALESCE(tx."totalOutputTokens", 0) as "totalOutputTokens",
      COALESCE(tx."totalTokens", 0) as "totalTokens",
      COALESCE(tx."totalSpent", 0) as "totalSpent",
      COALESCE(tx."totalAppProfit", 0) as "totalAppProfit",
      COALESCE(tx."totalMarkupProfit", 0) as "totalMarkupProfit",
      COALESCE(tx."totalReferralProfit", 0) as "totalReferralProfit",
      tx."lastTransactionAt" as "lastTransactionAt"
    FROM "users" u
    INNER JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) as "totalTransactions",
        COALESCE(SUM(tm."inputTokens"), 0) as "totalInputTokens",
        COALESCE(SUM(tm."outputTokens"), 0) as "totalOutputTokens",
        COALESCE(SUM(tm."totalTokens"), 0) as "totalTokens",
        COALESCE(SUM(t."totalCost"), 0) as "totalSpent",
        COALESCE(SUM(t."appProfit"), 0) as "totalAppProfit",
        COALESCE(SUM(t."markUpProfit"), 0) as "totalMarkupProfit",
        COALESCE(SUM(t."referralProfit"), 0) as "totalReferralProfit",
        MAX(t."createdAt") as "lastTransactionAt"
      FROM "transactions" t
      LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
      WHERE t."userId" = u.id AND t."echoAppId" = am."echoAppId"
    ) tx ON TRUE
    ${whereClause}
    GROUP BY 
      u.id,
      am.role, am.status, am."totalSpent", am."createdAt",
      tx."totalTransactions", tx."totalInputTokens", tx."totalOutputTokens", tx."totalTokens",
      tx."totalSpent", tx."totalAppProfit", tx."totalMarkupProfit", tx."totalReferralProfit",
      tx."lastTransactionAt"
    ${havingClause}
  `;

  const totalCountQuery = `SELECT COUNT(*) as count FROM (${countSourceQuery}) as filtered_results`;

  const totalCount = await db.$queryRawUnsafe<{ count: number }[]>(
    totalCountQuery,
    ...parameters
  );

  // Transform the results to match the expected interface
  const transformedResults = appUsers.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    totalPaid: user.totalPaid,
    userTotalSpent: user.userTotalSpent,
    membership: {
      role: user.membershipRole,
      status: user.membershipStatus,
      totalSpent: user.membershipTotalSpent,
      createdAt: user.membershipCreatedAt,
    },
    totalTransactions: user.totalTransactions,
    totalInputTokens: user.totalInputTokens,
    totalOutputTokens: user.totalOutputTokens,
    totalTokens: user.totalTokens,
    totalSpent: user.totalSpent,
    totalAppProfit: user.totalAppProfit,
    totalMarkupProfit: user.totalMarkupProfit,
    totalReferralProfit: user.totalReferralProfit,
    lastTransactionAt: user.lastTransactionAt,
  }));

  // Return in the expected format
  return toPaginatedReponse({
    items: transformedResults,
    page: params.page,
    page_size: params.page_size,
    total_count: Number((totalCount[0] as { count: number }).count),
  });
};
