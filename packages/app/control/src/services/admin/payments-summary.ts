import { db } from '@/lib/db';
import { OverviewMetricConfig } from './type/overview-metric';

function percentChange(currentValue: number | bigint, previousValue: number | bigint): number {
  const currentNumber = Number(currentValue) || 0;
  const previousNumber = Number(previousValue) || 0;
  if (previousNumber === 0) return currentNumber ? 100 : 0;
  const delta = currentNumber - previousNumber;
  return (delta / previousNumber) * 100;
}

type PaymentsOverviewRow = {
  totalAmount: number;
  stripeAmount: number;
  adminAmount: number;
  signUpGiftAmount: number;
  uniquePayers: number;
};

type PaymentsTrendRow = {
  total_current: number;
  total_prev: number;
  stripe_current: number;
  stripe_prev: number;
  admin_current: number;
  admin_prev: number;
  signup_current: number;
  signup_prev: number;
  unique_payers_current: number;
  unique_payers_prev: number;
};

export async function getPaymentsOverviewMetrics(): Promise<OverviewMetricConfig[]> {
  const summaryQuery = `
    WITH p AS (
      SELECT 
        COALESCE(SUM(p.amount), 0)::double precision AS total_amount,
        COALESCE(SUM(CASE WHEN p.source = 'stripe' and p.status = 'completed' THEN p.amount END), 0)::double precision AS stripe_amount,
        COALESCE(SUM(CASE WHEN p.source = 'admin' and p.status = 'completed' THEN p.amount END), 0)::double precision AS admin_amount,
        COALESCE(SUM(CASE WHEN p.source = 'signUpGift' and p.status = 'completed' THEN p.amount END), 0)::double precision AS signup_amount,
        COALESCE(COUNT(DISTINCT CASE WHEN p.status = 'completed' AND p.source = 'stripe' THEN p."userId" END), 0)::double precision AS unique_payers
      FROM "payments" p
      WHERE p."isArchived" = false
    )
    SELECT 
      p.total_amount AS "totalAmount",
      p.stripe_amount AS "stripeAmount",
      p.admin_amount AS "adminAmount",
      p.signup_amount AS "signUpGiftAmount",
      p.unique_payers AS "uniquePayers"
    FROM p;
  `;

  const summary = (await db.$queryRawUnsafe(summaryQuery)) as Array<PaymentsOverviewRow>;
  const s = summary[0] || {
    totalAmount: 0,
    stripeAmount: 0,
    adminAmount: 0,
    signUpGiftAmount: 0,
    uniquePayers: 0,
  };

  const trendQuery = `
    WITH ranges AS (
      SELECT 
        (NOW()::date - INTERVAL '7 days') AS start_current,
        NOW()::date AS end_current,
        (NOW()::date - INTERVAL '14 days') AS start_prev,
        (NOW()::date - INTERVAL '7 days') AS end_prev
    ), t AS (
      SELECT 
        COALESCE(SUM(CASE WHEN p."createdAt" >= r.start_current AND p."createdAt" < r.end_current THEN p.amount END), 0)::double precision AS total_current,
        COALESCE(SUM(CASE WHEN p."createdAt" >= r.start_prev AND p."createdAt" < r.end_prev THEN p.amount END), 0)::double precision AS total_prev,
        COALESCE(SUM(CASE WHEN p.source = 'stripe' AND p."createdAt" >= r.start_current AND p."createdAt" < r.end_current THEN p.amount END), 0)::double precision AS stripe_current,
        COALESCE(SUM(CASE WHEN p.source = 'stripe' AND p."createdAt" >= r.start_prev AND p."createdAt" < r.end_prev THEN p.amount END), 0)::double precision AS stripe_prev,
        COALESCE(SUM(CASE WHEN p.source = 'admin' AND p."createdAt" >= r.start_current AND p."createdAt" < r.end_current THEN p.amount END), 0)::double precision AS admin_current,
        COALESCE(SUM(CASE WHEN p.source = 'admin' AND p."createdAt" >= r.start_prev AND p."createdAt" < r.end_prev THEN p.amount END), 0)::double precision AS admin_prev,
        COALESCE(SUM(CASE WHEN p.source = 'signUpGift' AND p."createdAt" >= r.start_current AND p."createdAt" < r.end_current THEN p.amount END), 0)::double precision AS signup_current,
        COALESCE(SUM(CASE WHEN p.source = 'signUpGift' AND p."createdAt" >= r.start_prev AND p."createdAt" < r.end_prev THEN p.amount END), 0)::double precision AS signup_prev
      FROM "payments" p, ranges r
      WHERE p."isArchived" = false
    ), u AS (
      SELECT 
        COALESCE(COUNT(DISTINCT CASE WHEN p.source = 'stripe' AND p.status = 'completed' AND p."createdAt" >= r.start_current AND p."createdAt" < r.end_current THEN p."userId" END), 0)::double precision AS unique_payers_current,
        COALESCE(COUNT(DISTINCT CASE WHEN p.source = 'stripe' AND p.status = 'completed' AND p."createdAt" >= r.start_prev AND p."createdAt" < r.end_prev THEN p."userId" END), 0)::double precision AS unique_payers_prev
      FROM "payments" p, ranges r
      WHERE p."isArchived" = false
    )
    SELECT 
      t.total_current,
      t.total_prev,
      t.stripe_current,
      t.stripe_prev,
      t.admin_current,
      t.admin_prev,
      t.signup_current,
      t.signup_prev,
      u.unique_payers_current,
      u.unique_payers_prev
    FROM t, u;
  `;

  const trendRows = (await db.$queryRawUnsafe(trendQuery)) as Array<PaymentsTrendRow>;
  const t = trendRows[0] || {
    total_current: 0,
    total_prev: 0,
    stripe_current: 0,
    stripe_prev: 0,
    admin_current: 0,
    admin_prev: 0,
    signup_current: 0,
    signup_prev: 0,
    unique_payers_current: 0,
    unique_payers_prev: 0,
  };

  const trendLabel = 'vs previous 7d';

  const stripeFees = s.stripeAmount * 0.029;
  const stripeFeesCurrent = t.stripe_current * 0.029;
  const stripeFeesPrev = t.stripe_prev * 0.029;

  const metrics: OverviewMetricConfig[] = [
    {
      id: 'totalPaymentVolume',
      title: 'Total Payment Volume',
      description: 'Total amount paid into the platform (all sources)',
      displayType: 'currency',
      value: s.totalAmount,
      trendValue: percentChange(t.total_current, t.total_prev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'stripePayments',
      title: 'Stripe Payments',
      description: 'Total amount of payments from Stripe',
      displayType: 'currency',
      value: s.stripeAmount,
      trendValue: percentChange(t.stripe_current, t.stripe_prev),
      size: 'md',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'adminCredits',
      title: 'Admin Credits',
      description: 'Total amount of payments from Admin',
      displayType: 'currency',
      value: s.adminAmount,
      trendValue: percentChange(t.admin_current, t.admin_prev),
      size: 'sm',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'signupGifts',
      title: 'Sign-up Gifts',
      description: 'Total amount of payments from Sign-up Gift',
      displayType: 'currency',
      value: s.signUpGiftAmount,
      trendValue: percentChange(t.signup_current, t.signup_prev),
      size: 'sm',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'stripeFees',
      title: 'Stripe Fees (2.9%)',
      description: 'Estimated Stripe processing fees on Stripe payments',
      displayType: 'currency',
      value: stripeFees,
      trendValue: percentChange(stripeFeesCurrent, stripeFeesPrev),
      size: 'sm',
      format: { showTrend: true, decimals: 2, trendLabel },
    },
    {
      id: 'uniquePayers',
      title: 'Unique Payers',
      description: 'Distinct users who made at least one payment',
      displayType: 'number',
      value: s.uniquePayers,
      trendValue: percentChange(t.unique_payers_current, t.unique_payers_prev),
      size: 'sm',
      format: { showTrend: true, trendLabel },
    },
  ];

  return metrics;
}


