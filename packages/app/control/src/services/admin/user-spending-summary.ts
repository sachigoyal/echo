import { db } from '@/services/db/client';
import type { OverviewMetricConfig } from './type/overview-metric';
import { percentChange } from './util/percent-change';

interface SpendingOverviewRow {
  totalSpend: number;
  totalPayments: number;
  totalFreeTierUsage: number;
  totalOutstandingBalance: number;
  spendingUsers: number;
}

interface SpendingTrendRow {
  spend_current: number;
  spend_prev: number;
  payments_current: number;
  payments_prev: number;
  free_tier_current: number;
  free_tier_prev: number;
  spending_users_current: number;
  spending_users_prev: number;
}

export async function getUserSpendingOverviewMetrics(): Promise<
  OverviewMetricConfig[]
> {
  const summaryQuery = `
    WITH t AS (
      SELECT 
        COALESCE(SUM(t."totalCost"), 0)::double precision AS total_spend,
        COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL THEN t."totalCost" END), 0)::double precision AS total_free_tier_usage
      FROM "transactions" t
    ), p AS (
      SELECT COALESCE(SUM(p."amount"), 0)::double precision AS total_payments
      FROM "payments" p
      WHERE p."isArchived" = false
        AND p."status" = 'completed'
        AND p."source" = 'stripe'
    ), b AS (
      SELECT COALESCE(SUM(u."totalPaid" - u."totalSpent"), 0)::double precision AS total_outstanding_balance
      FROM "users" u
    ), su AS (
      SELECT COUNT(DISTINCT t2."userId")::double precision AS spending_users
      FROM "transactions" t2
    )
    SELECT 
      t.total_spend AS "totalSpend",
      p.total_payments AS "totalPayments",
      t.total_free_tier_usage AS "totalFreeTierUsage",
      b.total_outstanding_balance AS "totalOutstandingBalance",
      su.spending_users AS "spendingUsers"
    FROM t, p, b, su;
  `;

  const summary = await db.$queryRawUnsafe<SpendingOverviewRow[]>(summaryQuery);
  const s = summary[0] ?? {
    totalSpend: 0,
    totalPayments: 0,
    totalFreeTierUsage: 0,
    totalOutstandingBalance: 0,
    spendingUsers: 0,
  };

  const trendQuery = `
    WITH ranges AS (
      SELECT 
        (NOW()::date - INTERVAL '7 days') AS start_current,
        NOW()::date AS end_current,
        (NOW()::date - INTERVAL '14 days') AS start_prev,
        (NOW()::date - INTERVAL '7 days') AS end_prev
    ),
    txn AS (
      SELECT 
        COALESCE(SUM(CASE WHEN t."createdAt" >= r.start_current AND t."createdAt" < r.end_current THEN t."totalCost" END), 0)::double precision AS spend_current,
        COALESCE(SUM(CASE WHEN t."createdAt" >= r.start_prev AND t."createdAt" < r.end_prev THEN t."totalCost" END), 0)::double precision AS spend_prev,
        COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL AND t."createdAt" >= r.start_current AND t."createdAt" < r.end_current THEN t."totalCost" END), 0)::double precision AS free_tier_current,
        COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL AND t."createdAt" >= r.start_prev AND t."createdAt" < r.end_prev THEN t."totalCost" END), 0)::double precision AS free_tier_prev
      FROM "transactions" t, ranges r
    ),
    pay AS (
      SELECT 
        COALESCE(SUM(CASE WHEN p."createdAt" >= r.start_current AND p."createdAt" < r.end_current THEN p."amount" END), 0)::double precision AS payments_current,
        COALESCE(SUM(CASE WHEN p."createdAt" >= r.start_prev AND p."createdAt" < r.end_prev THEN p."amount" END), 0)::double precision AS payments_prev
      FROM "payments" p, ranges r
      WHERE p."isArchived" = false
        AND p."status" = 'completed'
        AND p."source" = 'stripe'
    ),
    su AS (
      SELECT 
        COALESCE(COUNT(DISTINCT CASE WHEN t."createdAt" >= r.start_current AND t."createdAt" < r.end_current THEN t."userId" END), 0)::double precision AS spending_users_current,
        COALESCE(COUNT(DISTINCT CASE WHEN t."createdAt" >= r.start_prev AND t."createdAt" < r.end_prev THEN t."userId" END), 0)::double precision AS spending_users_prev
      FROM "transactions" t, ranges r
    )
    SELECT 
      txn.spend_current,
      txn.spend_prev,
      pay.payments_current,
      pay.payments_prev,
      txn.free_tier_current,
      txn.free_tier_prev,
      su.spending_users_current,
      su.spending_users_prev
    FROM txn, pay, su;
  `;

  const trendRows = await db.$queryRawUnsafe<SpendingTrendRow[]>(trendQuery);
  const t = trendRows[0] || {
    spend_current: 0,
    spend_prev: 0,
    payments_current: 0,
    payments_prev: 0,
    free_tier_current: 0,
    free_tier_prev: 0,
    spending_users_current: 0,
    spending_users_prev: 0,
  };

  const trendLabel = 'vs previous 7d';

  const avgCurrent = t.spending_users_current
    ? t.spend_current / t.spending_users_current
    : 0;
  const avgPrev = t.spending_users_prev
    ? t.spend_prev / t.spending_users_prev
    : 0;
  const netBalanceDeltaCurrent = t.payments_current - t.spend_current;
  const netBalanceDeltaPrev = t.payments_prev - t.spend_prev;

  const metrics: OverviewMetricConfig[] = [
    {
      id: 'totalSpend',
      title: 'Total User Spend',
      description: 'Total amount users have spent via transactions',
      displayType: 'currency',
      value: s.totalSpend,
      trendValue: percentChange(t.spend_current, t.spend_prev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'totalPayments',
      title: 'Total Payments',
      description: 'Total payments received from users',
      displayType: 'currency',
      value: s.totalPayments,
      trendValue: percentChange(t.payments_current, t.payments_prev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'totalFreeTierUsage',
      title: 'Free Tier Usage',
      description: 'Total consumption covered by spend pools',
      displayType: 'currency',
      value: s.totalFreeTierUsage,
      trendValue: percentChange(t.free_tier_current, t.free_tier_prev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'spendingUsers',
      title: 'Spending Users',
      description: 'Distinct users with at least one transaction',
      displayType: 'number',
      value: s.spendingUsers,
      trendValue: percentChange(
        t.spending_users_current,
        t.spending_users_prev
      ),
      size: 'sm',
      format: { showTrend: true, trendLabel },
    },
    {
      id: 'avgSpendPerUser',
      title: 'Avg Spend per User',
      description: 'Average spend per spending user',
      displayType: 'currency',
      value: s.spendingUsers ? s.totalSpend / s.spendingUsers : 0,
      trendValue: percentChange(avgCurrent, avgPrev),
      size: 'sm',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'totalOutstandingBalance',
      title: 'Outstanding Balance',
      description: 'Sum of user balances (paid minus spent)',
      displayType: 'currency',
      value: s.totalOutstandingBalance,
      trendValue: percentChange(netBalanceDeltaCurrent, netBalanceDeltaPrev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
  ];

  return metrics;
}
