/**
 * App Users Service - Shows users of a specific app with their token usage and spending
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns app user data in the expected format.
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

export interface AppUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  totalPaid: number;
  userTotalSpent: number;
  membership: {
    role: string;
    status: string;
    totalSpent: number;
    createdAt: Date;
  };
  totalTransactions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalSpent: number;
  totalAppProfit: number;
  totalMarkupProfit: number;
  totalReferralProfit: number;
  lastTransactionAt: Date | null;
}

// Map frontend column names to SQL expressions
const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'u.id',
  name: 'u.name',
  email: 'u.email',
  createdAt: 'u."createdAt"',
  updatedAt: 'u."updatedAt"',
  membershipRole: 'am.role',
  membershipStatus: 'am.status',
  membershipTotalSpent: 'am."totalSpent"',
  membershipCreatedAt: 'am."createdAt"',
  totalTransactions: 'COUNT(t.id)',
  totalInputTokens: 'COALESCE(SUM(tm."inputTokens"), 0)',
  totalOutputTokens: 'COALESCE(SUM(tm."outputTokens"), 0)',
  totalTokens: 'COALESCE(SUM(tm."totalTokens"), 0)',
  totalSpent: 'COALESCE(SUM(t."totalCost"), 0)',
  totalAppProfit: 'COALESCE(SUM(t."appProfit"), 0)',
  totalMarkupProfit: 'COALESCE(SUM(t."markUpProfit"), 0)',
  totalReferralProfit: 'COALESCE(SUM(t."referralProfit"), 0)',
  lastTransactionAt: 'MAX(t."createdAt")',
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
      ],
      dateColumns: [
        'createdAt',
        'updatedAt',
        'membershipCreatedAt',
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
      COUNT(t.id) as "totalTransactions",
      COALESCE(SUM(tm."inputTokens"), 0) as "totalInputTokens",
      COALESCE(SUM(tm."outputTokens"), 0) as "totalOutputTokens",
      COALESCE(SUM(tm."totalTokens"), 0) as "totalTokens",
      COALESCE(SUM(t."totalCost"), 0) as "totalSpent",
      COALESCE(SUM(t."appProfit"), 0) as "totalAppProfit",
      COALESCE(SUM(t."markUpProfit"), 0) as "totalMarkupProfit",
      COALESCE(SUM(t."referralProfit"), 0) as "totalReferralProfit",
      MAX(t."createdAt") as "lastTransactionAt"
    FROM "users" u
    INNER JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN "transactions" t ON u.id = t."userId" AND am."echoAppId" = t."echoAppId"
    LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
    ${whereClause}
    GROUP BY u.id, u.name, u.email, u."createdAt", u."updatedAt", u."totalPaid", u."totalSpent",
             am.role, am.status, am."totalSpent", am."createdAt"
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
  const appUsers = (await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  )) as Array<{
    id: string;
    name: string | null;
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
    lastTransactionAt: Date | null;
  }>;

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as count
    FROM "users" u
    INNER JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN "transactions" t ON u.id = t."userId" AND am."echoAppId" = t."echoAppId"
    LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
    ${whereClause}
    ${havingClause ? `GROUP BY u.id ${havingClause}` : ''}
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
    total_count: Number(totalCount[0].count),
  });
};
