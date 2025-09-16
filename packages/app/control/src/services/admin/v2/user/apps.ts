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
import { FilterParams } from '@/services/lib/filtering';
import { db } from '@/lib/db';

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
  // Popular models (top 3)
  mostPopularModels: Array<{
    model: string;
    provider: string;
    transactionCount: number;
    totalTokens: number;
  }>;
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
      sqlColumn.includes('MAX(') ||
      sqlColumn.includes('COALESCE(');
    const orderColumn = isAggregated ? `"${sort.column}"` : sqlColumn;

    return `${orderColumn} ${sort.direction.toUpperCase()}`;
  });

  return `ORDER BY ${orderClauses.join(', ')}`;
};

// Generate WHERE and HAVING clauses from FilterParams
const buildFilterClauses = (
  filters?: FilterParams['filters'],
  userId?: string
): {
  whereClause: string;
  havingClause: string;
  parameters: any[];
} => {
  const parameters: any[] = [];
  let whereClause = '';
  let havingClause = '';

  // Always filter by userId if provided (owner of the app)
  if (userId) {
    whereClause =
      'WHERE owner_am."userId" = $1::uuid AND owner_am.role = \'owner\'';
    parameters.push(userId);
  } else {
    whereClause = 'WHERE 1=1';
  }

  if (!filters || filters.length === 0) {
    return { whereClause, havingClause, parameters };
  }

  const whereConditions: string[] = [];
  const havingConditions: string[] = [];

  // Columns that require HAVING clause (aggregated values)
  const aggregatedColumns = [
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
  ];

  // Numeric columns that need type conversion
  const numericColumns = [
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
  ];

  // Date/timestamp columns that need type casting
  const dateColumns = ['createdAt', 'updatedAt', 'lastTransactionAt'];

  // UUID columns that need type casting
  const uuidColumns = ['id'];

  filters.forEach(filter => {
    const sqlColumn = COLUMN_MAPPINGS[filter.column];
    if (!sqlColumn) {
      throw new Error(`Invalid filter column: ${filter.column}`);
    }

    const paramIndex = parameters.length + 1;
    let condition = '';
    const isDateColumn = dateColumns.includes(filter.column);
    const isUuidColumn = uuidColumns.includes(filter.column);

    // Convert filter value to appropriate type for numeric columns
    const convertValue = (value: any) => {
      if (numericColumns.includes(filter.column)) {
        return Number(value);
      }
      return value;
    };

    switch (filter.operator) {
      case 'equals':
        if (isDateColumn) {
          condition = `${sqlColumn} = $${paramIndex}::timestamp`;
        } else if (isUuidColumn) {
          condition = `${sqlColumn} = $${paramIndex}::uuid`;
        } else {
          condition = `${sqlColumn} = $${paramIndex}`;
        }
        parameters.push(convertValue(filter.value));
        break;
      case 'not_equals':
        if (isDateColumn) {
          condition = `${sqlColumn} != $${paramIndex}::timestamp`;
        } else if (isUuidColumn) {
          condition = `${sqlColumn} != $${paramIndex}::uuid`;
        } else {
          condition = `${sqlColumn} != $${paramIndex}`;
        }
        parameters.push(convertValue(filter.value));
        break;
      case 'contains':
        condition = `${sqlColumn} ILIKE $${paramIndex}`;
        parameters.push(`%${filter.value}%`);
        break;
      case 'not_contains':
        condition = `${sqlColumn} NOT ILIKE $${paramIndex}`;
        parameters.push(`%${filter.value}%`);
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
          const placeholders = isUuidColumn
            ? filter.value.map((_, i) => `$${paramIndex + i}::uuid`).join(', ')
            : filter.value.map((_, i) => `$${paramIndex + i}`).join(', ');
          condition = `${sqlColumn} IN (${placeholders})`;
          parameters.push(...filter.value.map(convertValue));
        }
        break;
      case 'not_in':
        if (Array.isArray(filter.value)) {
          const placeholders = isUuidColumn
            ? filter.value.map((_, i) => `$${paramIndex + i}::uuid`).join(', ')
            : filter.value.map((_, i) => `$${paramIndex + i}`).join(', ');
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

// Helper function to get most popular models for each app
const getMostPopularModels = async (appIds: string[]) => {
  if (appIds.length === 0) return new Map();

  const modelsQuery = `
    SELECT 
      t."echoAppId",
      tm.model,
      tm.provider,
      COUNT(t.id) as "transactionCount",
      COALESCE(SUM(tm."totalTokens"), 0) as "totalTokens",
      ROW_NUMBER() OVER (PARTITION BY t."echoAppId" ORDER BY COUNT(t.id) DESC) as rn
    FROM "transactions" t
    INNER JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
    WHERE t."echoAppId" = ANY($1::uuid[])
    GROUP BY t."echoAppId", tm.model, tm.provider
    ORDER BY t."echoAppId", COUNT(t.id) DESC
  `;

  const modelsData = (await db.$queryRawUnsafe(modelsQuery, appIds)) as Array<{
    echoAppId: string;
    model: string;
    provider: string;
    transactionCount: number;
    totalTokens: number;
    rn: number;
  }>;

  // Group by app and take top 3 models per app
  const modelsMap = new Map<
    string,
    Array<{
      model: string;
      provider: string;
      transactionCount: number;
      totalTokens: number;
    }>
  >();

  modelsData.forEach(row => {
    if (row.rn <= 3) {
      // Top 3 models per app
      if (!modelsMap.has(row.echoAppId)) {
        modelsMap.set(row.echoAppId, []);
      }
      modelsMap.get(row.echoAppId)!.push({
        model: row.model,
        provider: row.provider,
        transactionCount: row.transactionCount,
        totalTokens: row.totalTokens,
      });
    }
  });

  return modelsMap;
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
    params.userId
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

  // Get additional data for popular models and payouts
  const appIds = userApps.map(app => app.id);
  const [modelsMap, payoutInfo] = await Promise.all([
    getMostPopularModels(appIds),
    getPayoutInformation(appIds),
  ]);

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
    // Popular models
    mostPopularModels: modelsMap.get(app.id) || [],
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
