/**
 * TRPC function that demonstrates integration with StatefulDataTable for payment history
 * This shows how to create a TRPC procedure that accepts standardized pagination,
 * sorting, and filtering parameters and returns payment data in the expected format.
 */

import { PaginationParams, toPaginatedReponse } from "@/services/lib/pagination"
import { MultiSortParams } from "@/services/lib/sorting"
import { FilterParams } from "@/services/lib/filtering"
import { db } from "@/lib/db"
import { Payment, EnumPaymentSource } from "@/generated/prisma"

export interface PaymentHistory extends Payment {
  user: {
    id: string
    name: string | null
    email: string
  }
  spendPool: {
    id: string
    name: string
    description: string | null
    echoApp: {
      id: string
      name: string
    }
  } | null
}

// Map frontend column names to SQL expressions
const COLUMN_MAPPINGS: Record<string, string> = {
  id: 'p.id',
  paymentId: 'p."paymentId"',
  amount: 'p.amount',
  currency: 'p.currency',
  status: 'p.status',
  source: 'p.source',
  description: 'p.description',
  createdAt: 'p."createdAt"',
  updatedAt: 'p."updatedAt"',
  userId: 'u.id',
  userName: 'u.name',
  userEmail: 'u.email',
  spendPoolId: 'sp.id',
  spendPoolName: 'sp.name',
  spendPoolDescription: 'sp.description',
  appId: 'app.id',
  appName: 'app.name'
}

// Generate ORDER BY clause from MultiSortParams
const buildOrderByClause = (sorts?: MultiSortParams['sorts']): string => {
  if (!sorts || sorts.length === 0) {
    return 'ORDER BY p."createdAt" DESC'
  }

  const orderClauses = sorts.map(sort => {
    const sqlColumn = COLUMN_MAPPINGS[sort.column]
    if (!sqlColumn) {
      throw new Error(`Invalid sort column: ${sort.column}`)
    }
    
    return `${sqlColumn} ${sort.direction.toUpperCase()}`
  })

  return `ORDER BY ${orderClauses.join(', ')}`
}

// Generate WHERE clause from FilterParams
const buildFilterClauses = (filters?: FilterParams['filters']): { 
  whereClause: string; 
  parameters: any[] 
} => {
  let whereClause = 'WHERE p."isArchived" = false'
  const parameters: any[] = []

  if (!filters || filters.length === 0) {
    return { whereClause, parameters }
  }

  const whereConditions: string[] = []

  // Numeric columns that need type conversion
  const numericColumns = ['amount']

  // Date/timestamp columns that need type casting
  const dateColumns = ['createdAt', 'updatedAt']

  // Enum columns that need special handling
  const enumColumns = ['source', 'status']

  filters.forEach((filter, index) => {
    const sqlColumn = COLUMN_MAPPINGS[filter.column]
    if (!sqlColumn) {
      throw new Error(`Invalid filter column: ${filter.column}`)
    }

    const paramIndex = parameters.length + 1
    let condition = ''
    const isDateColumn = dateColumns.includes(filter.column)

    // Convert filter value to appropriate type for numeric columns
    const convertValue = (value: any) => {
      if (numericColumns.includes(filter.column)) {
        return Number(value)
      }
      return value
    }

    switch (filter.operator) {
      case 'equals':
        condition = isDateColumn 
          ? `${sqlColumn} = $${paramIndex}::timestamp`
          : `${sqlColumn} = $${paramIndex}`
        parameters.push(convertValue(filter.value))
        break
      case 'not_equals':
        condition = isDateColumn 
          ? `${sqlColumn} != $${paramIndex}::timestamp`
          : `${sqlColumn} != $${paramIndex}`
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
          const placeholders = filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
          condition = `${sqlColumn} IN (${placeholders})`
          parameters.push(...filter.value.map(convertValue))
        }
        break
      case 'not_in':
        if (Array.isArray(filter.value)) {
          const placeholders = filter.value.map((_, i) => `$${paramIndex + i}`).join(', ')
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
      whereConditions.push(condition)
    }
  })

  if (whereConditions.length > 0) {
    whereClause += ` AND (${whereConditions.join(' AND ')})`
  }

  return { whereClause, parameters }
}

// Main TRPC procedure function for payment history
export const getPaymentsWithPagination = async (
  params: PaginationParams & MultiSortParams & FilterParams
) => {
  // Build dynamic clauses
  const { whereClause, parameters } = buildFilterClauses(params.filters)
  const orderByClause = buildOrderByClause(params.sorts)

  // Build the main query with dynamic clauses
  const baseQuery = `
    SELECT 
      p.id,
      p."paymentId",
      p.amount,
      p.currency,
      p.status,
      p.source,
      p.description,
      p."isArchived",
      p."archivedAt",
      p."createdAt",
      p."updatedAt",
      p."userId",
      p."spendPoolId",
      u.id as "user_id",
      u.name as "user_name",
      u.email as "user_email",
      sp.id as "spendPool_id",
      sp.name as "spendPool_name",
      sp.description as "spendPool_description",
      app.id as "app_id",
      app.name as "app_name"
    FROM "payments" p
    INNER JOIN "users" u ON p."userId" = u.id
    LEFT JOIN "spend_pools" sp ON p."spendPoolId" = sp.id
    LEFT JOIN "echo_apps" app ON sp."echoAppId" = app.id
    ${whereClause}
    ${orderByClause}
    LIMIT $${parameters.length + 1} 
    OFFSET $${parameters.length + 2}
  `

  // Add pagination parameters
  const queryParameters = [...parameters, params.page_size, params.page * params.page_size]

  // Execute the main query
  const payments = await db.$queryRawUnsafe(
    baseQuery,
    ...queryParameters
  ) as Array<{
    id: string
    paymentId: string
    amount: number
    currency: string
    status: string
    source: EnumPaymentSource
    description: string | null
    isArchived: boolean
    archivedAt: Date | null
    createdAt: Date
    updatedAt: Date
    userId: string
    spendPoolId: string | null
    user_id: string
    user_name: string | null
    user_email: string
    spendPool_id: string | null
    spendPool_name: string | null
    spendPool_description: string | null
    app_id: string | null
    app_name: string | null
  }>

  // Build count query with same filters
  const countQuery = `
    SELECT COUNT(*) as count
    FROM "payments" p
    INNER JOIN "users" u ON p."userId" = u.id
    LEFT JOIN "spend_pools" sp ON p."spendPoolId" = sp.id
    LEFT JOIN "echo_apps" app ON sp."echoAppId" = app.id
    ${whereClause}
  `

  const totalCount = await db.$queryRawUnsafe(
    countQuery,
    ...parameters
  ) as Array<{ count: bigint }>

  // Transform the results to match the expected interface
  const transformedResults = payments.map(payment => ({
    id: payment.id,
    paymentId: payment.paymentId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    source: payment.source,
    description: payment.description,
    isArchived: payment.isArchived,
    archivedAt: payment.archivedAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    userId: payment.userId,
    spendPoolId: payment.spendPoolId,
    user: {
      id: payment.user_id,
      name: payment.user_name,
      email: payment.user_email
    },
    spendPool: payment.spendPool_id ? {
      id: payment.spendPool_id,
      name: payment.spendPool_name!,
      description: payment.spendPool_description,
      echoApp: {
        id: payment.app_id!,
        name: payment.app_name!
      }
    } : null
  }))

  // Return in the expected format
  return toPaginatedReponse({
    items: transformedResults,
    page: params.page,
    page_size: params.page_size,
    total_count: Number(totalCount[0].count),
  })
}
