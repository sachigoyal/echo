/**
 * User Spending Service - Shows user spending analytics
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns spending data in the expected format.
 */

import {
  PaginationParams,
  toPaginatedReponse,
} from '@/services/lib/pagination';
import { MultiSortParams } from '@/services/lib/sorting';
import { buildOrderByClause } from '@/services/admin/util/build-order-by-clause';
import { FilterParams } from '@/services/lib/filtering';
import { db } from '@/lib/db';
import { User } from '@/generated/prisma';
import { buildFilterClauses } from '@/services/admin/util/build-filter-clause';

export interface UserSpending extends User {
  balance: number;
  freeTierUsage: number;
}

// Map frontend column names to SQL expressions
const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'u.id',
  name: 'u.name',
  email: 'u.email',
  totalSpent: 'u."totalSpent"',
  totalPaid: 'u."totalPaid"',
  balance: '(u."totalPaid" - u."totalSpent")',
  freeTierUsage: 'COALESCE(SUM(uspu."totalSpent"), 0)',
  createdAt: 'u."createdAt"',
  updatedAt: 'u."updatedAt"',
};

// Use shared builder

// Main function for getting user spending data with pagination
export const getUserSpendingWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams
) => {
  // Build dynamic clauses
  const { whereClause, havingClause, parameters } = buildFilterClauses(
    params.filters,
    {
      columnMappings: COLUMN_MAPPINGS,
      defaultWhere: 'WHERE 1=1',
      aggregatedColumns: ['freeTierUsage'],
      dateColumns: ['createdAt', 'updatedAt'],
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
      u."totalSpent",
      (u."totalPaid" - u."totalSpent") as "balance",
      COALESCE(SUM(uspu."totalSpent"), 0) as "freeTierUsage",
      u."totalPaid",
      u."createdAt",
      u."updatedAt"
    FROM "users" u
    LEFT JOIN "app_memberships" am ON u.id = am."userId" 
    LEFT JOIN "user_spend_pool_usage" uspu ON u.id = uspu."userId"
    LEFT JOIN "payments" p ON u.id = p."userId"
    ${whereClause}
    GROUP BY u.id, u.name, u.email, u."totalSpent", u."totalPaid", u."createdAt", u."updatedAt"
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
  const usersWithSpending = (await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  )) as Array<{
    id: string;
    name: string | null;
    email: string;
    totalSpent: number;
    balance: number;
    freeTierUsage: number;
    createdAt: Date;
    updatedAt: Date;
  }>;

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as count
    FROM "users" u
    LEFT JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN "user_spend_pool_usage" uspu ON u.id = uspu."userId"
    LEFT JOIN "payments" p ON u.id = p."userId"
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

  // Return in the expected format
  return toPaginatedReponse({
    items: usersWithSpending,
    page: params.page,
    page_size: params.page_size,
    total_count: Number(totalCount[0].count),
  });
};
