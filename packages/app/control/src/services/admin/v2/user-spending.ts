/**
 * User Spending Service - Shows user spending analytics
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns spending data in the expected format.
 */

import { PaginationParams, toPaginatedReponse } from "@/services/lib/pagination"
import { MultiSortParams } from "@/services/lib/sorting"
import { FilterParams } from "@/services/lib/filtering"
import { db } from "@/lib/db"
import { User } from "@/generated/prisma"

export interface UserSpending extends User {
  balance: number
  freeTierUsage: number
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
  updatedAt: 'u."updatedAt"'
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
  let whereClause = 'WHERE 1=1'
  let havingClause = ''
  const parameters: any[] = []

  if (!filters || filters.length === 0) {
    return { whereClause, havingClause, parameters }
  }

  const whereConditions: string[] = []
  const havingConditions: string[] = []

  // Columns that require HAVING clause (aggregated values)
  const aggregatedColumns = [
    'freeTierUsage'
  ]

  // Date/timestamp columns that need type casting
  const dateColumns = ['createdAt', 'updatedAt']

  filters.forEach((filter, index) => {
    const sqlColumn = COLUMN_MAPPINGS[filter.column]
    if (!sqlColumn) {
      throw new Error(`Invalid filter column: ${filter.column}`)
    }

    const paramIndex = parameters.length + 1
    let condition = ''
    const isDateColumn = dateColumns.includes(filter.column)

    switch (filter.operator) {
      case 'equals':
        condition = isDateColumn 
          ? `${sqlColumn} = $${paramIndex}::timestamp`
          : `${sqlColumn} = $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'not_equals':
        condition = isDateColumn 
          ? `${sqlColumn} != $${paramIndex}::timestamp`
          : `${sqlColumn} != $${paramIndex}`
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
        condition = isDateColumn 
          ? `${sqlColumn} > $${paramIndex}::timestamp`
          : `${sqlColumn} > $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'less_than':
        condition = isDateColumn 
          ? `${sqlColumn} < $${paramIndex}::timestamp`
          : `${sqlColumn} < $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'greater_than_or_equal':
        condition = isDateColumn 
          ? `${sqlColumn} >= $${paramIndex}::timestamp`
          : `${sqlColumn} >= $${paramIndex}`
        parameters.push(filter.value)
        break
      case 'less_than_or_equal':
        condition = isDateColumn 
          ? `${sqlColumn} <= $${paramIndex}::timestamp`
          : `${sqlColumn} <= $${paramIndex}`
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

// Main function for getting user spending data with pagination
export const getUserSpendingWithPagination = async (
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
  `

  // Add pagination parameters
  const queryParameters = [...parameters, params.page_size, params.page * params.page_size]

  // Execute the main query
  const usersWithSpending = await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  ) as Array<{
    id: string
    name: string | null
    email: string
    totalSpent: number
    balance: number
    freeTierUsage: number
    createdAt: Date
    updatedAt: Date
  }>

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(DISTINCT u.id) as count
    FROM "users" u
    LEFT JOIN "app_memberships" am ON u.id = am."userId"
    LEFT JOIN "user_spend_pool_usage" uspu ON u.id = uspu."userId"
    LEFT JOIN "payments" p ON u.id = p."userId"
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
    items: usersWithSpending,
    page: params.page,
    page_size: params.page_size,
    total_count: Number(totalCount[0].count),
  })
}
