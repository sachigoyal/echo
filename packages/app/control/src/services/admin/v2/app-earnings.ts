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
import { FilterParams } from '@/services/lib/filtering';
import { db } from '@/lib/db';
import { EchoApp } from '@/generated/prisma';

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

// Generate ORDER BY clause from MultiSortParams
const buildOrderByClause = (sorts?: MultiSortParams['sorts']): string => {
  if (!sorts || sorts.length === 0) {
    return 'ORDER BY a."createdAt" DESC';
  }

  const orderClauses = sorts.map(sort => {
    const sqlColumn = COLUMN_MAPPINGS[sort.column];
    if (!sqlColumn) {
      throw new Error(`Invalid sort column: ${sort.column}`);
    }

    // For aggregated columns, use the alias in ORDER BY
    const isAggregated =
      sqlColumn.includes('SUM(') ||
      sqlColumn.includes('COUNT(') ||
      sqlColumn.includes('COALESCE(');
    const orderColumn = isAggregated ? `"${sort.column}"` : sqlColumn;

    return `${orderColumn} ${sort.direction.toUpperCase()}`;
  });

  return `ORDER BY ${orderClauses.join(', ')}`;
};

// Generate WHERE and HAVING clauses from FilterParams
const buildFilterClauses = (
  filters?: FilterParams['filters']
): {
  whereClause: string;
  havingClause: string;
  parameters: any[];
} => {
  let whereClause = "WHERE owner_am.role = 'owner'";
  let havingClause = '';
  const parameters: any[] = [];

  if (!filters || filters.length === 0) {
    return { whereClause, havingClause, parameters };
  }

  const whereConditions: string[] = [];
  const havingConditions: string[] = [];

  // Columns that require HAVING clause (aggregated values)
  const aggregatedColumns = [
    'totalTransactions',
    'totalRevenue',
    'totalAppProfit',
    'totalMarkupProfit',
    'totalReferralProfit',
    'totalReferralCodes',
    'totalUsers',
  ];

  // Numeric columns that need type conversion
  const numericColumns = [
    'totalTransactions',
    'totalRevenue',
    'totalAppProfit',
    'totalMarkupProfit',
    'totalReferralProfit',
    'totalReferralCodes',
    'totalUsers',
  ];

  // Date/timestamp columns that need type casting
  const dateColumns = ['createdAt', 'updatedAt'];

  filters.forEach((filter, index) => {
    const sqlColumn = COLUMN_MAPPINGS[filter.column];
    if (!sqlColumn) {
      throw new Error(`Invalid filter column: ${filter.column}`);
    }

    const paramIndex = parameters.length + 1;
    let condition = '';
    const isDateColumn = dateColumns.includes(filter.column);

    // Convert filter value to appropriate type for numeric columns
    const convertValue = (value: any) => {
      if (numericColumns.includes(filter.column)) {
        return Number(value);
      }
      return value;
    };

    switch (filter.operator) {
      case 'equals':
        condition = isDateColumn
          ? `${sqlColumn} = $${paramIndex}::timestamp`
          : `${sqlColumn} = $${paramIndex}`;
        parameters.push(convertValue(filter.value));
        break;
      case 'not_equals':
        condition = isDateColumn
          ? `${sqlColumn} != $${paramIndex}::timestamp`
          : `${sqlColumn} != $${paramIndex}`;
        parameters.push(convertValue(filter.value));
        break;
      case 'contains':
        condition = `${sqlColumn} ILIKE $${paramIndex}`;
        parameters.push(`%${filter.value}%`);
        break;
      case 'not_contains':
        condition = `${sqlColumn} NOT ILIKE $${paramIndex}`;
        parameters.push(`%${filter.value}`);
        break;
      case 'starts_with':
        condition = `${sqlColumn} ILIKE $${paramIndex}`;
        parameters.push(`${filter.value}%`);
        break;
      case 'ends_with':
        condition = `${sqlColumn} ILIKE $${paramIndex}`;
        parameters.push(`%${filter.value}`);
        break;
      case 'greater_than':
        condition = isDateColumn
          ? `${sqlColumn} > $${paramIndex}::timestamp`
          : `${sqlColumn} > $${paramIndex}`;
        parameters.push(convertValue(filter.value));
        break;
      case 'less_than':
        condition = isDateColumn
          ? `${sqlColumn} < $${paramIndex}::timestamp`
          : `${sqlColumn} < $${paramIndex}`;
        parameters.push(convertValue(filter.value));
        break;
      case 'greater_than_or_equal':
        condition = isDateColumn
          ? `${sqlColumn} >= $${paramIndex}::timestamp`
          : `${sqlColumn} >= $${paramIndex}`;
        parameters.push(convertValue(filter.value));
        break;
      case 'less_than_or_equal':
        condition = isDateColumn
          ? `${sqlColumn} <= $${paramIndex}::timestamp`
          : `${sqlColumn} <= $${paramIndex}`;
        parameters.push(convertValue(filter.value));
        break;
      case 'in':
        if (Array.isArray(filter.value)) {
          const placeholders = filter.value
            .map((_, i) => `$${paramIndex + i}`)
            .join(', ');
          condition = `${sqlColumn} IN (${placeholders})`;
          parameters.push(...filter.value.map(convertValue));
        }
        break;
      case 'not_in':
        if (Array.isArray(filter.value)) {
          const placeholders = filter.value
            .map((_, i) => `$${paramIndex + i}`)
            .join(', ');
          condition = `${sqlColumn} NOT IN (${placeholders})`;
          parameters.push(...filter.value.map(convertValue));
        }
        break;
      case 'is_null':
        condition = `${sqlColumn} IS NULL`;
        break;
      case 'is_not_null':
        condition = `${sqlColumn} IS NOT NULL`;
        break;
      default:
        throw new Error(`Unsupported filter operator: ${filter.operator}`);
    }

    if (condition) {
      // Decide whether this filter goes in WHERE or HAVING
      if (aggregatedColumns.includes(filter.column)) {
        havingConditions.push(condition);
      } else {
        whereConditions.push(condition);
      }
    }
  });

  if (whereConditions.length > 0) {
    whereClause += ` AND (${whereConditions.join(' AND ')})`;
  }

  if (havingConditions.length > 0) {
    havingClause = `HAVING ${havingConditions.join(' AND ')}`;
  }

  return { whereClause, havingClause, parameters };
};

// Main TRPC procedure function for app earnings
export const getAppEarningsWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams
) => {
  // Build dynamic clauses
  const { whereClause, havingClause, parameters } = buildFilterClauses(
    params.filters
  );
  const orderByClause = buildOrderByClause(params.sorts);

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
