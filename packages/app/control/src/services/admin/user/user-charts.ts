import type { ChartItem } from '../type/chart';
import { getUserCreatorActivity } from '@/services/user/activity';
import type { ChartConfig } from '@/components/ui/chart';

interface GetUserAppsChartsInput {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  numBuckets?: number;
}

export const getUserAppsCharts = async (
  input: GetUserAppsChartsInput
): Promise<ChartItem[]> => {
  // Align to 24-hour buckets: default to last 30 days (30 buckets)
  const startOfUtcDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

  const defaultEndExclusive = new Date(
    startOfUtcDay(new Date()).getTime() + 24 * 60 * 60 * 1000
  );
  const endDate = input.endDate ?? defaultEndExclusive;
  const startDate =
    input.startDate ??
    new Date(
      (input.endDate
        ? startOfUtcDay(input.endDate)
        : defaultEndExclusive
      ).getTime() -
        30 * 24 * 60 * 60 * 1000
    );
  const numBuckets = input.numBuckets ?? 30;

  const activity = await getUserCreatorActivity(input.userId, {
    startDate,
    endDate,
    numBuckets,
  });

  const dataWithLabels = activity.map(b => ({
    // Keep a stable, readable label; ISO date (date part) is enough for buckets
    timestamp: b.timestamp.toISOString().slice(0, 16),
    profit: Number(b.totalProfit || 0),
    transactions: Number(b.transactionCount || 0),
  }));

  const profitConfig: ChartConfig = {
    profit: { label: 'Markup Profit', color: '#16a34a' }, // green
  };

  const transactionsConfig: ChartConfig = {
    transactions: { label: 'Transactions', color: '#2563eb' }, // blue
  };

  const charts: ChartItem[] = [
    {
      id: 'markup-profit-over-time',
      type: 'area-linear',
      title: 'Markup Profit over time',
      props: {
        title: 'Markup Profit',
        description:
          'Markup profit across user-owned apps over the last 30 days',
        data: dataWithLabels,
        config: profitConfig,
        xAxisDataKey: 'timestamp',
        areaDataKey: 'profit',
      },
      size: 'md',
    },
    {
      id: 'transactions-over-time',
      type: 'area-linear',
      title: 'Transactions over time',
      props: {
        title: 'Transactions',
        description:
          'Number of transactions across user-owned apps over the last 30 days',
        data: dataWithLabels,
        config: transactionsConfig,
        xAxisDataKey: 'timestamp',
        areaDataKey: 'transactions',
      },
      size: 'md',
    },
  ];

  return charts;
};
