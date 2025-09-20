import { db } from '@/lib/db';
import type { OverviewMetricConfig } from './type/overview-metric';
import { percentChange } from './util/percent-change';

type AppEarningsOverviewRow = {
  totalRevenue: number;
  totalTransactions: number;
  activeApps: number;
  avgRevenuePerActiveApp: number;
  avgTransactionValue: number;
  freeTierUsage: number;
};

type AppEarningsTrendRow = {
  spend_current: number;
  spend_prev: number;
  tx_count_current: number;
  tx_count_prev: number;
  active_apps_current: number;
  active_apps_prev: number;
  free_tier_current: number;
  free_tier_prev: number;
};

export async function getAppEarningsOverviewMetrics(): Promise<
  OverviewMetricConfig[]
> {
  const summaryQuery = `
    WITH t AS (
      SELECT 
        COALESCE(SUM(t."totalCost"), 0)::double precision AS total_revenue,
        COALESCE(COUNT(t.id), 0)::double precision AS total_transactions,
        COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL THEN t."totalCost" END), 0)::double precision AS free_tier_usage
      FROM "transactions" t
    ), a AS (
      SELECT COALESCE(COUNT(DISTINCT t2."echoAppId"), 0)::double precision AS active_apps
      FROM "transactions" t2
    ), avg_tx AS (
      SELECT COALESCE(AVG(t3."totalCost"), 0)::double precision AS avg_txn_value
      FROM "transactions" t3
    )
    SELECT 
      t.total_revenue AS "totalRevenue",
      t.total_transactions AS "totalTransactions",
      a.active_apps AS "activeApps",
      CASE WHEN a.active_apps > 0 THEN t.total_revenue / a.active_apps ELSE 0 END AS "avgRevenuePerActiveApp",
      avg_tx.avg_txn_value AS "avgTransactionValue",
      t.free_tier_usage AS "freeTierUsage"
    FROM t, a, avg_tx;
  `;

  const summary =
    await db.$queryRawUnsafe<AppEarningsOverviewRow[]>(summaryQuery);
  const s = summary[0] || {
    totalRevenue: 0,
    totalTransactions: 0,
    activeApps: 0,
    avgRevenuePerActiveApp: 0,
    avgTransactionValue: 0,
    freeTierUsage: 0,
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
        COALESCE(COUNT(CASE WHEN t."createdAt" >= r.start_current AND t."createdAt" < r.end_current THEN 1 END), 0)::double precision AS tx_count_current,
        COALESCE(COUNT(CASE WHEN t."createdAt" >= r.start_prev AND t."createdAt" < r.end_prev THEN 1 END), 0)::double precision AS tx_count_prev,
        COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL AND t."createdAt" >= r.start_current AND t."createdAt" < r.end_current THEN t."totalCost" END), 0)::double precision AS free_tier_current,
        COALESCE(SUM(CASE WHEN t."spendPoolId" IS NOT NULL AND t."createdAt" >= r.start_prev AND t."createdAt" < r.end_prev THEN t."totalCost" END), 0)::double precision AS free_tier_prev
      FROM "transactions" t, ranges r
    ),
    apps AS (
      SELECT 
        COALESCE(COUNT(DISTINCT CASE WHEN t."createdAt" >= r.start_current AND t."createdAt" < r.end_current THEN t."echoAppId" END), 0)::double precision AS active_apps_current,
        COALESCE(COUNT(DISTINCT CASE WHEN t."createdAt" >= r.start_prev AND t."createdAt" < r.end_prev THEN t."echoAppId" END), 0)::double precision AS active_apps_prev
      FROM "transactions" t, ranges r
    )
    SELECT 
      txn.spend_current,
      txn.spend_prev,
      txn.tx_count_current,
      txn.tx_count_prev,
      apps.active_apps_current,
      apps.active_apps_prev,
      txn.free_tier_current,
      txn.free_tier_prev
    FROM txn, apps;
  `;

  const trendRows = await db.$queryRawUnsafe<AppEarningsTrendRow[]>(trendQuery);
  const t = trendRows[0] || {
    spend_current: 0,
    spend_prev: 0,
    tx_count_current: 0,
    tx_count_prev: 0,
    active_apps_current: 0,
    active_apps_prev: 0,
    free_tier_current: 0,
    free_tier_prev: 0,
  };

  const trendLabel = 'vs previous 7d';

  const avgRevCurrent = t.active_apps_current
    ? t.spend_current / t.active_apps_current
    : 0;
  const avgRevPrev = t.active_apps_prev ? t.spend_prev / t.active_apps_prev : 0;
  const avgTxnCurrent = t.tx_count_current
    ? t.spend_current / t.tx_count_current
    : 0;
  const avgTxnPrev = t.tx_count_prev ? t.spend_prev / t.tx_count_prev : 0;

  const metrics: OverviewMetricConfig[] = [
    {
      id: 'totalRevenue',
      title: 'Total Revenue',
      description: 'Total revenue generated across all apps',
      displayType: 'currency',
      value: s.totalRevenue,
      trendValue: percentChange(t.spend_current, t.spend_prev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'activeApps',
      title: 'Active Apps',
      description: 'Apps with at least one transaction',
      displayType: 'number',
      value: s.activeApps,
      trendValue: percentChange(t.active_apps_current, t.active_apps_prev),
      size: 'sm',
      format: { showTrend: true, trendLabel },
    },
    {
      id: 'avgRevenuePerActiveApp',
      title: 'Avg Revenue / Active App',
      description: 'Average revenue per active app',
      displayType: 'currency',
      value: s.avgRevenuePerActiveApp,
      trendValue: percentChange(avgRevCurrent, avgRevPrev),
      size: 'sm',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'totalTransactions',
      title: 'Total Transactions',
      description: 'Number of transactions across all apps',
      displayType: 'number',
      value: s.totalTransactions,
      trendValue: percentChange(t.tx_count_current, t.tx_count_prev),
      size: 'sm',
      format: { showTrend: true, trendLabel },
    },
    {
      id: 'avgTransactionValue',
      title: 'Avg Transaction Value',
      description: 'Average spend per transaction',
      displayType: 'currency',
      value: s.avgTransactionValue,
      trendValue: percentChange(avgTxnCurrent, avgTxnPrev),
      size: 'sm',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'freeTierUsage',
      title: 'Free Tier Usage',
      description: 'Total consumption covered by spend pools',
      displayType: 'currency',
      value: s.freeTierUsage,
      trendValue: percentChange(t.free_tier_current, t.free_tier_prev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
  ];

  return metrics;
}
