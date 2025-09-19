import { ChartItem } from '@/services/admin/type/chart';
import { ChartConfig } from '@/components/ui/chart';
import { db } from '@/lib/db';

interface GetHomePageChartInput {
  startDate?: Date;
  endDate?: Date;
  numBuckets?: number; // default 30 (daily buckets over last 30 days)
}

export const getHomePageChart = async (
  input?: GetHomePageChartInput
): Promise<ChartItem[]> => {
  const startOfUtcDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  const defaultEndExclusive = new Date(
    startOfUtcDay(new Date()).getTime() + 24 * 60 * 60 * 1000
  );

  const endDate = input?.endDate ?? defaultEndExclusive;
  const startDate =
    input?.startDate ??
    new Date(
      (input?.endDate
        ? startOfUtcDay(input.endDate)
        : defaultEndExclusive
      ).getTime() -
        30 * 24 * 60 * 60 * 1000
    );
  const numBuckets = input?.numBuckets ?? 30;

  const [transactions, users, apps, refreshTokens] = await Promise.all([
    db.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isArchived: false,
      },
      select: {
        createdAt: true,
        transactionMetadata: {
          select: {
            totalTokens: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isArchived: false,
      },
      select: { createdAt: true },
    }),
    db.echoApp.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isArchived: false,
      },
      select: { createdAt: true },
    }),
    db.refreshToken.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isArchived: false,
      },
      select: { createdAt: true },
    }),
  ]);

  const totalMs = endDate.getTime() - startDate.getTime();
  const bucketSizeMs = Math.max(1, Math.floor(totalMs / numBuckets));

  const makeBuckets = () =>
    Array.from({ length: numBuckets }, (_, i) => {
      const bucketStart = new Date(startDate.getTime() + i * bucketSizeMs);
      return { timestamp: bucketStart } as { timestamp: Date } & Record<
        string,
        number
      >;
    });

  // Tokens per bucket
  const tokenBuckets = makeBuckets().map(b => ({ ...b, tokens: 0 }));
  for (const t of transactions) {
    const idx = Math.floor(
      (t.createdAt.getTime() - startDate.getTime()) / bucketSizeMs
    );
    if (idx >= 0 && idx < numBuckets) {
      const amt = Number(t.transactionMetadata?.totalTokens || 0);
      tokenBuckets[idx].tokens += amt;
    }
  }
  const tokensData = tokenBuckets.map(b => ({
    timestamp: b.timestamp.toISOString().slice(0, 16),
    tokens: Number(b.tokens || 0),
  }));

  // User signups per bucket
  const signupBuckets = makeBuckets().map(b => ({ ...b, signups: 0 }));
  for (const u of users) {
    const idx = Math.floor(
      (u.createdAt.getTime() - startDate.getTime()) / bucketSizeMs
    );
    if (idx >= 0 && idx < numBuckets) {
      signupBuckets[idx].signups += 1;
    }
  }
  const signupsData = signupBuckets.map(b => ({
    timestamp: b.timestamp.toISOString().slice(0, 16),
    signups: Number(b.signups || 0),
  }));

  // App creations per bucket
  const appBuckets = makeBuckets().map(b => ({ ...b, apps: 0 }));
  for (const a of apps) {
    const idx = Math.floor(
      (a.createdAt.getTime() - startDate.getTime()) / bucketSizeMs
    );
    if (idx >= 0 && idx < numBuckets) {
      appBuckets[idx].apps += 1;
    }
  }
  const appsData = appBuckets.map(b => ({
    timestamp: b.timestamp.toISOString().slice(0, 16),
    apps: Number(b.apps || 0),
  }));

  // Refresh tokens created per bucket
  const rtBuckets = makeBuckets().map(b => ({ ...b, refreshTokens: 0 }));
  for (const rt of refreshTokens) {
    const idx = Math.floor(
      (rt.createdAt.getTime() - startDate.getTime()) / bucketSizeMs
    );
    if (idx >= 0 && idx < numBuckets) {
      rtBuckets[idx].refreshTokens += 1;
    }
  }
  const refreshTokensData = rtBuckets.map(b => ({
    timestamp: b.timestamp.toISOString().slice(0, 16),
    refreshTokens: Number(b.refreshTokens || 0),
  }));

  // Chart configs
  const tokensConfig: ChartConfig = {
    tokens: { label: 'Tokens', color: '#7c3aed' },
  };
  const signupsConfig: ChartConfig = {
    signups: { label: 'User Signups', color: '#16a34a' },
  };
  const appsConfig: ChartConfig = {
    apps: { label: 'App Creations', color: '#f59e0b' },
  };
  const refreshTokensConfig: ChartConfig = {
    refreshTokens: { label: 'Refresh Tokens', color: '#2563eb' },
  };

  const charts: ChartItem[] = [
    {
      id: 'total-tokens-over-time',
      type: 'area-linear',
      title: 'Total Tokens',
      description:
        'Total tokens generated across all apps over the last 30 days',
      props: {
        title: 'Total Tokens',
        description: 'Tokens generated per day (last 30 days)',
        data: tokensData,
        config: tokensConfig,
        xAxisDataKey: 'timestamp',
        areaDataKey: 'tokens',
      },
      size: 'md',
    },
    {
      id: 'user-signups-per-day',
      type: 'area-linear',
      title: 'User Signups per Day',
      description: 'New users created over the last 30 days',
      props: {
        title: 'User Signups',
        description: 'New users per day (last 30 days)',
        data: signupsData,
        config: signupsConfig,
        xAxisDataKey: 'timestamp',
        areaDataKey: 'signups',
      },
      size: 'md',
    },
    {
      id: 'app-creations-per-day',
      type: 'area-linear',
      title: 'App Creations per Day',
      description: 'New apps created over the last 30 days',
      props: {
        title: 'App Creations',
        description: 'New apps per day (last 30 days)',
        data: appsData,
        config: appsConfig,
        xAxisDataKey: 'timestamp',
        areaDataKey: 'apps',
      },
      size: 'md',
    },
    {
      id: 'refresh-tokens-created-per-day',
      type: 'area-linear',
      title: 'Refresh Tokens per Day',
      description: 'Refresh tokens created over the last 30 days',
      props: {
        title: 'Refresh Tokens',
        description: 'Refresh tokens created per day (last 30 days)',
        data: refreshTokensData,
        config: refreshTokensConfig,
        xAxisDataKey: 'timestamp',
        areaDataKey: 'refreshTokens',
      },
      size: 'md',
    },
  ];

  return charts;
};
