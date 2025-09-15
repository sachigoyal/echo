/**
 * App Users Service - Shows users of a specific app with their token usage and spending
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns app user data in the expected format.
 */

import { PaginationParams, toPaginatedReponse } from "@/services/lib/pagination"
import { MultiSortParams } from "@/services/lib/sorting"
import { FilterParams } from "@/services/lib/filtering"
import { db } from "@/lib/db"
import { User } from "@/generated/prisma"

export interface AppUser {
  id: string
  name: string | null
  email: string
  createdAt: Date
  updatedAt: Date
  totalPaid: number
  userTotalSpent: number
  membership: {
    role: string
    status: string
    totalSpent: number
    createdAt: Date
  }
  totalTransactions: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  totalSpent: number
  totalAppProfit: number
  totalMarkupProfit: number
  totalReferralProfit: number
  lastTransactionAt: Date | null
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
  lastTransactionAt: 'MAX(t."createdAt")'
}

// Generate ORDER BY clause from MultiSortParams
const buildOrderByClause = (sorts?: MultiSortParams['sorts']): string => {
  if (!sorts || sorts.length === 0) {
    return 'ORDER BY am."createdAt" DESC'
  }

  const orderClauses = sorts.map(sort => {
    const sqlColumn = COLUMN_MAPPINGS[sort.column]
    if (!sqlColumn) {
      throw new Error(`Invalid sort column: ${sort.column}`)
    }
    
    // For aggregated columns, use the alias in ORDER BY
    const isAggregated = sqlColumn.includes('SUM(') || sqlColumn.includes('COUNT(') || sqlColumn.includes('MAX(') || sqlColumn.includes('COALESCE(')
    const orderColumn = isAggregated ? `"${sort.column}"` : sqlColumn
    
    return `${orderColumn} ${sort.direction.toUpperCase()}`
  })

  return `ORDER BY ${orderClauses.join(', ')}`
}

// Generate WHERE and HAVING clauses from FilterParams
const buildFilterClauses = (filters?: FilterParams['filters'], appId?: string): { 
  whereClause: string; 
  havingClause: string; 
  parameters: any[] 
} => {
  const parameters: any[] = []
  let whereClause = ''
  let havingClause = ''

  // Always filter by appId if provided
  if (appId) {
    whereClause = 'WHERE am."echoAppId" = $1::uuid'
    parameters.push(appId)
  } else {
    whereClause = 'WHERE 1=1'
  }

  if (!filters || filters.length === 0) {
    return { whereClause, havingClause, parameters }
  }

  const whereConditions: string[] = []
  const havingConditions: string[] = []

  // Columns that require HAVING clause (aggregated values)
  const aggregatedColumns = [
    'totalTransactions', 'totalInputTokens', 'totalOutputTokens', 'totalTokens',
    'totalSpent', 'totalAppProfit', 'totalMarkupProfit', 'totalReferralProfit',
    'lastTransactionAt'
  ]

  // Numeric columns that need type conversion
  const numericColumns = [
    'totalTransactions', 'totalInputTokens', 'totalOutputTokens', 'totalTokens',
    'totalSpent', 'totalAppProfit', 'totalMarkupProfit', 'totalReferralProfit',
    'membershipTotalSpent'
  ]

  // Date/timestamp columns that need type casting
  const dateColumns = ['createdAt', 'updatedAt', 'membershipCreatedAt', 'lastTransactionAt']
  
  // UUID columns that need type casting
  const uuidColumns = ['id']

  filters.forEach((filter) => {
    const sqlColumn = COLUMN_MAPPINGS[filter.column]
    if (!sqlColumn) {
      throw new Error(`Invalid filter column: ${filter.column}`)
    }

    const paramIndex = parameters.length + 1
    let condition = ''
    const isDateColumn = dateColumns.includes(filter.column)
    const isUuidColumn = uuidColumns.includes(filter.column)

    // Convert filter value to appropriate type for numeric columns
    const convertValue = (value: any) => {
      if (numericColumns.includes(filter.column)) {
        return Number(value)
      }
      return value
    }

    switch (filter.operator) {
      case 'equals':
        if (isDateColumn) {
          condition = `${sqlColumn} = $${paramIndex}::timestamp`
        } else if (isUuidColumn) {
          condition = `${sqlColumn} = $${paramIndex}::uuid`
        } else {
          condition = `${sqlColumn} = $${paramIndex}`
        }
        parameters.push(convertValue(filter.value))
        break
      case 'not_equals':
        if (isDateColumn) {
          condition = `${sqlColumn} != $${paramIndex}::timestamp`
        } else if (isUuidColumn) {
          condition = `${sqlColumn} != $${paramIndex}::uuid`
        } else {
          condition = `${sqlColumn} != $${paramIndex}`
        }
        parameters.push(convertValue(filter.value))
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
        condition = isDateColumn 
          ? `${sqlColumn} > $${paramIndex}::timestamp`
          : `${sqlColumn} > $${paramIndex}`
        parameters.push(convertValue(filter.value))
        break
      case 'less_than':
        condition = isDateColumn 
          ? `${sqlColumn} < $${paramIndex}::timestamp`
          : `${sqlColumn} < $${paramIndex}`
        parameters.push(convertValue(filter.value))
        break
      case 'greater_than_or_equal':
        condition = isDateColumn 
          ? `${sqlColumn} >= $${paramIndex}::timestamp`
          : `${sqlColumn} >= $${paramIndex}`
        parameters.push(convertValue(filter.value))
        break
      case 'less_than_or_equal':
        condition = isDateColumn 
          ? `${sqlColumn} <= $${paramIndex}::timestamp`
          : `${sqlColumn} <= $${paramIndex}`
        parameters.push(convertValue(filter.value))
        break
      case 'in':
        if (Array.isArray(filter.value)) {
          const placeholders = isUuidColumn 
            ? filter.value.map((_, i) => `$${paramIndex + i}::uuid`).join(', ')
            : filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
          condition = `${sqlColumn} IN (${placeholders})`
          parameters.push(...filter.value.map(convertValue))
        }
        break
      case 'not_in':
        if (Array.isArray(filter.value)) {
          const placeholders = isUuidColumn 
            ? filter.value.map((_, i) => `$${paramIndex + i}::uuid`).join(', ')
            : filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
          condition = `${sqlColumn} NOT IN (${placeholders})`
          parameters.push(...filter.value.map(convertValue))
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

// Main function for getting app users with pagination
export const getAppUsersWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams & { appId: string }
) => {
  // Build dynamic clauses
  const { whereClause, havingClause, parameters } = buildFilterClauses(params.filters, params.appId)
  const orderByClause = buildOrderByClause(params.sorts)

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
  `

  // Add pagination parameters
  const queryParameters = [...parameters, params.page_size, params.page * params.page_size]

  // Execute the main query
  const appUsers = await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  ) as Array<{
    id: string
    name: string | null
    email: string
    createdAt: Date
    updatedAt: Date
    totalPaid: number
    userTotalSpent: number
    membershipRole: string
    membershipStatus: string
    membershipTotalSpent: number
    membershipCreatedAt: Date
    totalTransactions: number
    totalInputTokens: number
    totalOutputTokens: number
    totalTokens: number
    totalSpent: number
    totalAppProfit: number
    totalMarkupProfit: number
    totalReferralProfit: number
    lastTransactionAt: Date | null
  }>

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as count
    FROM "users" u
    INNER JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN "transactions" t ON u.id = t."userId" AND am."echoAppId" = t."echoAppId"
    LEFT JOIN "transaction_metadata" tm ON t."transactionMetadataId" = tm.id
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
      createdAt: user.membershipCreatedAt
    },
    totalTransactions: user.totalTransactions,
    totalInputTokens: user.totalInputTokens,
    totalOutputTokens: user.totalOutputTokens,
    totalTokens: user.totalTokens,
    totalSpent: user.totalSpent,
    totalAppProfit: user.totalAppProfit,
    totalMarkupProfit: user.totalMarkupProfit,
    totalReferralProfit: user.totalReferralProfit,
    lastTransactionAt: user.lastTransactionAt
  }))

  // Return in the expected format
  return toPaginatedReponse({
    items: transformedResults,
    page: params.page,
    page_size: params.page_size,
    total_count: Number(totalCount[0].count),
  })
}
