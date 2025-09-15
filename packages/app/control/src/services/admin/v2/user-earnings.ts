/**
 * Example TRPC function that demonstrates integration with StatefulDataTable
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns data in the expected format.
 */

import { PaginationParams, toPaginatedReponse } from "@/services/lib/pagination"
import { MultiSortParams, SortDirection } from "@/services/lib/sorting"
import { FilterParams, FilterOperator, FilterValue } from "@/services/lib/filtering"
import { db } from "@/lib/db"
import { User } from "@/generated/prisma"
import { Prisma } from "@/generated/prisma"


export interface UserEarnings extends User {
  totalRevenue: number
  totalAppProfit: number
  totalMarkupProfit: number
  totalReferralProfit: number
  transactionCount: number
  uniqueEmailCampaigns: string[]
  referralCodesGenerated: number
  referredUsersCount: number
  totalCompletedPayouts: number
}

// Map frontend column names to SQL expressions
const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'u.id',
  name: 'u.name',
  email: 'u.email',
  totalRevenue: 'COALESCE(SUM(t."totalCost"), 0)',
  totalAppProfit: 'COALESCE(SUM(t."appProfit"), 0)',
  totalMarkupProfit: 'COALESCE(SUM(t."markUpProfit"), 0)',
  totalReferralProfit: 'COALESCE(SUM(t."referralProfit"), 0)',
  transactionCount: 'COUNT(t.id)',
  referralCodesGenerated: 'COUNT(DISTINCT rc.id) FILTER (WHERE rc."grantType" = \'referral\')',
  referredUsersCount: 'COUNT(DISTINCT am_referred.id)',
  totalCompletedPayouts: 'COALESCE(SUM(p."amount") FILTER (WHERE p."status" = \'completed\'), 0)'
}

// Generate ORDER BY clause from MultiSortParams
const buildOrderByClause = (sorts?: MultiSortParams['sorts']): string => {
  if (!sorts || sorts.length === 0) {
    return 'ORDER BY u."createdAt" DESC'
  }

  const orderClauses = sorts.map(sort => {
    const sqlColumn = COLUMN_MAPPINGS[sort.column]
    if (!sqlColumn) {
      throw new Error(`Invalid sort column: ${sort.column}`)
    }
    
    // For aggregated columns, use the alias in ORDER BY
    const isAggregated = sqlColumn.includes('SUM(') || sqlColumn.includes('COUNT(') || sqlColumn.includes('COALESCE(')
    const orderColumn = isAggregated ? `"${sort.column}"` : sqlColumn
    
    return `${orderColumn} ${sort.direction.toUpperCase()}`
  })

  return `ORDER BY ${orderClauses.join(', ')}`
}

// Generate WHERE and HAVING clauses from FilterParams
const buildFilterClauses = (filters?: FilterParams['filters']): { 
  whereClause: string; 
  havingClause: string; 
  parameters: any[] 
} => {
  let whereClause = 'WHERE am.role = \'owner\''
  let havingClause = ''
  const parameters: any[] = []

  if (!filters || filters.length === 0) {
    return { whereClause, havingClause, parameters }
  }

  const whereConditions: string[] = []
  const havingConditions: string[] = []

  // Columns that require HAVING clause (aggregated values)
  const aggregatedColumns = [
    'totalRevenue', 'totalAppProfit', 'totalMarkupProfit', 'totalReferralProfit', 
    'transactionCount', 'referralCodesGenerated', 'referredUsersCount', 'totalCompletedPayouts'
  ]

  filters.forEach((filter, index) => {
    const sqlColumn = COLUMN_MAPPINGS[filter.column]
    if (!sqlColumn) {
      throw new Error(`Invalid filter column: ${filter.column}`)
    }

    const paramIndex = parameters.length + 1
    let condition = ''

    switch (filter.operator) {
      case 'equals':
        condition = `${sqlColumn} = $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'not_equals':
        condition = `${sqlColumn} != $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'contains':
        condition = `${sqlColumn} ILIKE $${paramIndex}`
        parameters.push(`%${filter.value}%`)
        break
      case 'not_contains':
        condition = `${sqlColumn} NOT ILIKE $${paramIndex}`
        parameters.push(`%${filter.value}%`)
        break
      case 'starts_with':
        condition = `${sqlColumn} ILIKE $${paramIndex}`
        parameters.push(`${filter.value}%`)
        break
      case 'ends_with':
        condition = `${sqlColumn} ILIKE $${paramIndex}`
        parameters.push(`%${filter.value}`)
        break
      case 'greater_than':
        condition = `${sqlColumn} > $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'less_than':
        condition = `${sqlColumn} < $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'greater_than_or_equal':
        condition = `${sqlColumn} >= $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'less_than_or_equal':
        condition = `${sqlColumn} <= $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'in':
        if (Array.isArray(filter.value)) {
          const placeholders = filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
          condition = `${sqlColumn} IN (${placeholders})`
          parameters.push(...filter.value)
        }
        break
      case 'not_in':
        if (Array.isArray(filter.value)) {
          const placeholders = filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
          condition = `${sqlColumn} NOT IN (${placeholders})`
          parameters.push(...filter.value)
        }
        break
      case 'is_null':
        condition = `${sqlColumn} IS NULL`
        break
      case 'is_not_null':
        condition = `${sqlColumn} IS NOT NULL`
        break
      default:
        throw new Error(`Unsupported filter operator: ${filter.operator}`)
    }

    if (condition) {
      // Decide whether this filter goes in WHERE or HAVING
      if (aggregatedColumns.includes(filter.column)) {
        havingConditions.push(condition)
      } else {
        whereConditions.push(condition)
      }
    }
  })

  if (whereConditions.length > 0) {
    whereClause += ` AND (${whereConditions.join(' AND ')})`
  }

  if (havingConditions.length > 0) {
    havingClause = `HAVING ${havingConditions.join(' AND ')}`
  }

  return { whereClause, havingClause, parameters }
}

// Example TRPC procedure function
export const getUserEarningsWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams
) => {
  // Build dynamic clauses
  const { whereClause, havingClause, parameters } = buildFilterClauses(params.filters)
  const orderByClause = buildOrderByClause(params.sorts)

  // Build the main query with dynamic clauses
  const baseQuery = `
    SELECT 
      u.id,
      u.name,
      u.email,
      COALESCE(SUM(t."totalCost"), 0) as "totalRevenue",
      COALESCE(SUM(t."appProfit"), 0) as "totalAppProfit", 
      COALESCE(SUM(t."markUpProfit"), 0) as "totalMarkupProfit",
      COALESCE(SUM(t."referralProfit"), 0) as "totalReferralProfit",
      COUNT(t.id) as "transactionCount",
      COALESCE(
        array_agg(DISTINCT oes."emailCampaignId") FILTER (WHERE oes."emailCampaignId" IS NOT NULL),
        '{}'::text[]
      ) as "uniqueEmailCampaigns",
      COUNT(DISTINCT rc.id) FILTER (WHERE rc."grantType" = 'referral') as "referralCodesGenerated",
      COUNT(DISTINCT am_referred.id) as "referredUsersCount",
      COALESCE(SUM(p."amount") FILTER (WHERE p."status" = 'completed'), 0) as "totalCompletedPayouts"
    FROM "users" u
    INNER JOIN "app_memberships" am ON u.id = am."userId" 
    LEFT JOIN "transactions" t ON u.id = t."userId"
    LEFT JOIN "outbound_emails_sent" oes ON u.id = oes."userId"
    LEFT JOIN "referral_codes" rc ON u.id = rc."userId"
    LEFT JOIN "app_memberships" am_referred ON rc.id = am_referred."referrerId"
    LEFT JOIN "payouts" p ON u.id = p."userId"
    ${whereClause}
    GROUP BY u.id, u.name, u.email
    ${havingClause}
    ${orderByClause}
    LIMIT $${parameters.length + 1} 
    OFFSET $${parameters.length + 2}
  `

  // Add pagination parameters
  const queryParameters = [...parameters, params.page_size, params.page * params.page_size]

  // Execute the main query
  const usersWithEarnings = await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  ) as Array<{
    id: string
    name: string | null
    email: string
    totalRevenue: number
    totalAppProfit: number
    totalMarkupProfit: number
    totalReferralProfit: number
    transactionCount: number
    uniqueEmailCampaigns: string[]
    referralCodesGenerated: number
    referredUsersCount: number
    totalCompletedPayouts: number
  }>

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as count
    FROM "users" u
    INNER JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN "transactions" t ON u.id = t."userId"
    LEFT JOIN "outbound_emails_sent" oes ON u.id = oes."userId"
    LEFT JOIN "referral_codes" rc ON u.id = rc."userId"
    LEFT JOIN "app_memberships" am_referred ON rc.id = am_referred."referrerId"
    LEFT JOIN "payouts" p ON u.id = p."userId"
    ${whereClause}
    ${havingClause ? `GROUP BY u.id ${havingClause}` : ''}
  `

  // If we have HAVING clauses, we need to count the grouped results
  const totalCountQuery = havingClause 
    ? `SELECT COUNT(*) as count FROM (${countQuery}) as filtered_results`
    : countQuery

  const totalCount = await db.$queryRawUnsafe(
    totalCountQuery,
    ...parameters
  ) as Array<{ count: bigint }>

  // Return in the expected format
  return toPaginatedReponse({
    items: usersWithEarnings,
    page: params.page,
    page_size: params.page_size,
    total_count: Number(totalCount[0].count),
  })
}