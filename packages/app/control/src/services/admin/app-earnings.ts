/**
 * TRPC function that demonstrates integration with StatefulDataTable for app earnings
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns app earnings data in the expected format.
 */

import {
  PaginationParams,
  toPaginatedReponse,
} from '@/services/lib/pagination';
import { MultiSortParams } from '@/services/lib/sorting';
import { buildOrderByClause } from '@/services/admin/util/build-order-by-clause';
import { FilterParams } from '@/services/lib/filtering';
import { db } from '@/lib/db';
import { EchoApp } from '@/generated/prisma';
import { buildFilterClauses } from '@/services/admin/util/build-filter-clause';

export interface AppEarnings extends EchoApp {
  creatorUser: {
    id: string;
    name: string | null;
    email: string;
  };
  appEmailCampaigns: string[];
  ownerEmailCampaigns: string[];
  totalTransactions: number;
  totalRevenue: number;
  totalAppProfit: number;
  totalMarkupProfit: number;
  totalReferralProfit: number;
  totalReferralCodes: number;
  totalUsers: number;
}

// Map frontend column names to SQL expressions
const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'a.id',
  name: 'a.name',
  description: 'a.description',
  createdAt: 'a."createdAt"',
  updatedAt: 'a."updatedAt"',
  creatorUserId: 'creator.id',
  creatorUserName: 'creator.name',
  creatorUserEmail: 'creator.email',
  totalTransactions: 'COUNT(t.id)',
  totalRevenue: 'COALESCE(SUM(t."totalCost"), 0)',
  totalAppProfit: 'COALESCE(SUM(t."appProfit"), 0)',
  totalMarkupProfit: 'COALESCE(SUM(t."markUpProfit"), 0)',
  totalReferralProfit: 'COALESCE(SUM(t."referralProfit"), 0)',
  totalReferralCodes: 'COUNT(DISTINCT rc.id)',
  totalUsers: 'COUNT(DISTINCT am_users.id)',
};

// Main TRPC procedure function for app earnings
export const getAppEarningsWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams
) => {
  // Build dynamic clauses
  const { whereClause, havingClause, parameters } = buildFilterClauses(
    params.filters,
    {
      columnMappings: COLUMN_MAPPINGS,
      defaultWhere: "WHERE owner_am.role = 'owner'",
      aggregatedColumns: [
        'totalTransactions',
        'totalRevenue',
        'totalAppProfit',
        'totalMarkupProfit',
        'totalReferralProfit',
        'totalReferralCodes',
        'totalUsers',
      ],
      numericColumns: [
        'totalTransactions',
        'totalRevenue',
        'totalAppProfit',
        'totalMarkupProfit',
        'totalReferralProfit',
        'totalReferralCodes',
        'totalUsers',
      ],
      dateColumns: ['createdAt', 'updatedAt'],
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
      creator.id as "creatorUserId",
      creator.name as "creatorUserName",
      creator.email as "creatorUserEmail",
      COALESCE(
        array_agg(DISTINCT app_oes."emailCampaignId") FILTER (WHERE app_oes."emailCampaignId" IS NOT NULL),
        '{}'::text[]
      ) as "appEmailCampaigns",
      COALESCE(
        array_agg(DISTINCT owner_oes."emailCampaignId") FILTER (WHERE owner_oes."emailCampaignId" IS NOT NULL),
        '{}'::text[]
      ) as "ownerEmailCampaigns",
      COUNT(t.id) as "totalTransactions",
      COALESCE(SUM(t."totalCost"), 0) as "totalRevenue",
      COALESCE(SUM(t."appProfit"), 0) as "totalAppProfit",
      COALESCE(SUM(t."markUpProfit"), 0) as "totalMarkupProfit",
      COALESCE(SUM(t."referralProfit"), 0) as "totalReferralProfit",
      COUNT(DISTINCT rc.id) as "totalReferralCodes",
      COUNT(DISTINCT am_users.id) as "totalUsers"
    FROM "echo_apps" a
    INNER JOIN "app_memberships" owner_am ON a.id = owner_am."echoAppId"
    INNER JOIN "users" creator ON owner_am."userId" = creator.id
    LEFT JOIN "app_memberships" am_users ON a.id = am_users."echoAppId"
    LEFT JOIN "transactions" t ON a.id = t."echoAppId"
    LEFT JOIN "outbound_emails_sent" app_oes ON a.id = app_oes."echoAppId"
    LEFT JOIN "outbound_emails_sent" owner_oes ON creator.id = owner_oes."userId"
    LEFT JOIN "referral_codes" rc ON a.id = rc."echoAppId"
    ${whereClause}
    GROUP BY a.id, a.name, a.description, a."createdAt", a."updatedAt", creator.id, creator.name, creator.email
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
  const appsWithEarnings = (await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  )) as Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    creatorUserId: string;
    creatorUserName: string | null;
    creatorUserEmail: string;
    appEmailCampaigns: string[];
    ownerEmailCampaigns: string[];
    totalTransactions: number;
    totalRevenue: number;
    totalAppProfit: number;
    totalMarkupProfit: number;
    totalReferralProfit: number;
    totalReferralCodes: number;
    totalUsers: number;
  }>;

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(DISTINCT a.id) as count
    FROM "echo_apps" a
    INNER JOIN "app_memberships" owner_am ON a.id = owner_am."echoAppId"
    INNER JOIN "users" creator ON owner_am."userId" = creator.id
    LEFT JOIN "app_memberships" am_users ON a.id = am_users."echoAppId"
    LEFT JOIN "transactions" t ON a.id = t."echoAppId"
    LEFT JOIN "outbound_emails_sent" app_oes ON a.id = app_oes."echoAppId"
    LEFT JOIN "outbound_emails_sent" owner_oes ON creator.id = owner_oes."userId"
    LEFT JOIN "referral_codes" rc ON a.id = rc."echoAppId"
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
  const transformedResults = appsWithEarnings.map(app => ({
    id: app.id,
    name: app.name,
    description: app.description,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    creatorUser: {
      id: app.creatorUserId,
      name: app.creatorUserName,
      email: app.creatorUserEmail,
    },
    appEmailCampaigns: app.appEmailCampaigns,
    ownerEmailCampaigns: app.ownerEmailCampaigns,
    totalTransactions: app.totalTransactions,
    totalRevenue: app.totalRevenue,
    totalAppProfit: app.totalAppProfit,
    totalMarkupProfit: app.totalMarkupProfit,
    totalReferralProfit: app.totalReferralProfit,
    totalReferralCodes: app.totalReferralCodes,
    totalUsers: app.totalUsers,
  }));

  // Return in the expected format
  return toPaginatedReponse({
    items: transformedResults,
    page: params.page,
    page_size: params.page_size,
    total_count: Number(totalCount[0].count),
  });
};
