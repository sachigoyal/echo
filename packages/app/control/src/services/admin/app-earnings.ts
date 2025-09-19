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
import { buildFilterClauses } from '@/services/admin/util/build-filter-clause';

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
  // Use aggregated CTE outputs to avoid fan-out multiplication
  totalTransactions: 'COALESCE(txn.total_transactions, 0)',
  totalRevenue: 'COALESCE(txn.total_revenue, 0)',
  totalAppProfit: 'COALESCE(txn.total_app_profit, 0)',
  totalMarkupProfit: 'COALESCE(txn.total_markup_profit, 0)',
  totalReferralProfit: 'COALESCE(txn.total_referral_profit, 0)',
  totalReferralCodes: 'COALESCE(membership.total_referral_codes, 0)',
  totalUsers: 'COALESCE(membership.total_users, 0)',
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
    WITH txn AS (
      SELECT 
        t."echoAppId" AS app_id,
        COUNT(t.id)::double precision AS total_transactions,
        COALESCE(SUM(t."totalCost"), 0)::double precision AS total_revenue,
        COALESCE(SUM(t."appProfit"), 0)::double precision AS total_app_profit,
        COALESCE(SUM(t."markUpProfit"), 0)::double precision AS total_markup_profit,
        COALESCE(SUM(t."referralProfit"), 0)::double precision AS total_referral_profit
      FROM "transactions" t
      GROUP BY t."echoAppId"
    ), membership AS (
      SELECT 
        am."echoAppId" AS app_id,
        COALESCE(COUNT(DISTINCT am."userId"), 0)::double precision AS total_users,
        COALESCE(COUNT(DISTINCT am."referrerId") FILTER (WHERE am."referrerId" IS NOT NULL), 0)::double precision AS total_referral_codes
      FROM "app_memberships" am
      GROUP BY am."echoAppId"
    ), app_emails AS (
      SELECT 
        oes."echoAppId" AS app_id,
        COALESCE(array_agg(DISTINCT oes."emailCampaignId") FILTER (WHERE oes."emailCampaignId" IS NOT NULL), '{}'::text[]) AS app_email_campaigns
      FROM "outbound_emails_sent" oes
      GROUP BY oes."echoAppId"
    )
    SELECT 
      a.id,
      a.name,
      a.description,
      a."createdAt",
      a."updatedAt",
      creator.id as "creatorUserId",
      creator.name as "creatorUserName",
      creator.email as "creatorUserEmail",
      COALESCE(app_emails.app_email_campaigns, '{}'::text[]) as "appEmailCampaigns",
      COALESCE((
        SELECT COALESCE(array_agg(DISTINCT owner_oes."emailCampaignId") FILTER (WHERE owner_oes."emailCampaignId" IS NOT NULL), '{}'::text[])
        FROM "outbound_emails_sent" owner_oes 
        WHERE owner_oes."userId" = creator.id
      ), '{}'::text[]) as "ownerEmailCampaigns",
      ${COLUMN_MAPPINGS.totalTransactions} as "totalTransactions",
      ${COLUMN_MAPPINGS.totalRevenue} as "totalRevenue",
      ${COLUMN_MAPPINGS.totalAppProfit} as "totalAppProfit",
      ${COLUMN_MAPPINGS.totalMarkupProfit} as "totalMarkupProfit",
      ${COLUMN_MAPPINGS.totalReferralProfit} as "totalReferralProfit",
      ${COLUMN_MAPPINGS.totalReferralCodes} as "totalReferralCodes",
      ${COLUMN_MAPPINGS.totalUsers} as "totalUsers"
    FROM "echo_apps" a
    INNER JOIN "app_memberships" owner_am ON a.id = owner_am."echoAppId"
    INNER JOIN "users" creator ON owner_am."userId" = creator.id
    LEFT JOIN txn ON txn.app_id = a.id
    LEFT JOIN membership ON membership.app_id = a.id
    LEFT JOIN app_emails ON app_emails.app_id = a.id
    ${whereClause}
    GROUP BY a.id, a.name, a.description, a."createdAt", a."updatedAt", creator.id, creator.name, creator.email, app_emails.app_email_campaigns, txn.total_transactions, txn.total_revenue, txn.total_app_profit, txn.total_markup_profit, txn.total_referral_profit, membership.total_referral_codes, membership.total_users
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
    WITH txn AS (
      SELECT 
        t."echoAppId" AS app_id,
        COUNT(t.id)::double precision AS total_transactions,
        COALESCE(SUM(t."totalCost"), 0)::double precision AS total_revenue,
        COALESCE(SUM(t."appProfit"), 0)::double precision AS total_app_profit,
        COALESCE(SUM(t."markUpProfit"), 0)::double precision AS total_markup_profit,
        COALESCE(SUM(t."referralProfit"), 0)::double precision AS total_referral_profit
      FROM "transactions" t
      GROUP BY t."echoAppId"
    ), membership AS (
      SELECT 
        am."echoAppId" AS app_id,
        COALESCE(COUNT(DISTINCT am."userId"), 0)::double precision AS total_users,
        COALESCE(COUNT(DISTINCT am."referrerId") FILTER (WHERE am."referrerId" IS NOT NULL), 0)::double precision AS total_referral_codes
      FROM "app_memberships" am
      GROUP BY am."echoAppId"
    )
    SELECT COUNT(*) as count FROM (
      SELECT a.id
      FROM "echo_apps" a
      INNER JOIN "app_memberships" owner_am ON a.id = owner_am."echoAppId"
      INNER JOIN "users" creator ON owner_am."userId" = creator.id
      LEFT JOIN txn ON txn.app_id = a.id
      LEFT JOIN membership ON membership.app_id = a.id
      ${whereClause}
      GROUP BY a.id, a.name, a.description, a."createdAt", a."updatedAt", creator.id, creator.name, creator.email, txn.total_transactions, txn.total_revenue, txn.total_app_profit, txn.total_markup_profit, txn.total_referral_profit, membership.total_referral_codes, membership.total_users
      ${havingClause}
    ) grouped
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
