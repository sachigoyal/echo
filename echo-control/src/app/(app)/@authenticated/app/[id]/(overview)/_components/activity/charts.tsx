'use client';

import { format } from 'date-fns';
import {
  Charts,
  LoadingCharts,
} from '@/app/(app)/@authenticated/_components/charts';
import { ChartData } from '@/app/(app)/@authenticated/_components/charts/base-chart';

// import { api } from '@/trpc/client';
// import { useActivityContext } from '../context';

import { formatCurrency } from '@/lib/utils';

interface Props {
  appId: string;
}

const activity = Array.from({ length: 48 }, (_, i) => {
  const now = new Date();
  const bucketDate = new Date(now.getTime() - (19 - i) * 60 * 60 * 1000); // 1 hour per bucket, oldest first
  // Simulate jagged cost and profit
  const base = 100 + i * 20;
  const jag = Math.sin(i * 1.2) * 40 + (Math.random() - 0.5) * 60;
  const totalCost = Math.max(0, Math.round(base + jag));
  const totalProfit = Math.max(
    0,
    Math.round(totalCost * (0.1 + Math.random() * 0.2))
  );
  const totalTokens = Math.max(
    0,
    Math.round(totalCost * 10 + Math.random() * 100)
  );
  const totalInputTokens = Math.round(
    totalTokens * (0.6 + Math.random() * 0.2)
  );
  const totalOutputTokens = totalTokens - totalInputTokens;
  const totalTransactions = (totalTokens / Math.random()) * 1000;
  return {
    bucketDate,
    totalCost,
    totalProfit,
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    totalTransactions,
  };
});

export const ActivityCharts: React.FC<Props> = ({}) => {
  // const { startDate, endDate } = useActivityContext();

  // const [activitya] = api.activity.app.get.useSuspenseQuery({
  //   echoAppId: appId,
  //   startDate,
  //   endDate,
  // });

  //   // Transform data for the chart
  //   const chartData = activity.map(item => ({
  //     ...item,
  //     timestamp: format(new Date(item.timestamp), 'MMM dd HH:mm'),
  //   }));

  // Simulate 20 buckets of activity data for testing

  const totalProfit = activity.reduce((acc, item) => acc + item.totalProfit, 0);
  const totalTokens = activity.reduce((acc, item) => acc + item.totalTokens, 0);
  const totalTransactions = activity.reduce(
    (acc, item) => acc + item.totalTransactions,
    0
  );

  const chartData: ChartData<Omit<(typeof activity)[number], 'bucketDate'>>[] =
    activity.map(item => {
      return {
        ...item,
        timestamp: format(item.bucketDate, 'MMM dd HH:mm'),
      };
    });

  return (
    <Charts
      tabs={[
        {
          trigger: {
            value: 'profit',
            label: 'Profit',
            amount: formatCurrency(totalProfit),
          },
          areaProps: [
            {
              dataKey: 'totalCost',
              stroke:
                'color-mix(in oklab, var(--color-neutral-500) 60%, transparent)',
              fill: 'color-mix(in oklab, var(--color-neutral-500) 20%, transparent)',
            },
            {
              dataKey: 'totalProfit',
              stroke:
                'color-mix(in oklab, var(--color-primary) 100%, transparent)',
              fill: 'color-mix(in oklab, var(--color-primary) 60%, transparent)',
            },
          ],
          tooltipRows: [
            {
              key: 'totalProfit',
              label: 'Profit',
              getValue: data => formatCurrency(data),
              valueClassName: 'font-bold text-primary',
            },
            {
              key: 'totalCost',
              label: 'Cost',
              getValue: data => formatCurrency(data),
            },
          ],
        },
        {
          trigger: {
            value: 'tokens',
            label: 'Tokens',
            amount: totalTokens.toLocaleString(undefined, {
              notation: 'compact',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }),
          },
          areaProps: [
            {
              dataKey: 'totalInputTokens',
              stroke:
                'color-mix(in oklab, var(--color-primary) 100%, transparent)',
              fill: 'color-mix(in oklab, var(--color-primary) 20%, transparent)',
            },
            {
              dataKey: 'totalOutputTokens',
              stroke:
                'color-mix(in oklab, var(--color-primary) 100%, transparent)',
              fill: 'color-mix(in oklab, var(--color-primary) 40%, transparent)',
            },
          ],
          tooltipRows: [
            {
              key: 'totalInputTokens',
              label: 'Input Tokens',
              getValue: data =>
                data.toLocaleString(undefined, {
                  notation: 'compact',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4,
                }),
            },
            {
              key: 'totalOutputTokens',
              label: 'Output Tokens',
              getValue: data =>
                data.toLocaleString(undefined, {
                  notation: 'compact',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4,
                }),
            },
          ],
        },

        {
          trigger: {
            value: 'transactions',
            label: 'Transactions',
            amount: totalTransactions.toLocaleString(undefined, {
              notation: 'compact',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }),
          },
          areaProps: [
            {
              dataKey: 'totalTransactions',
              stroke:
                'color-mix(in oklab, var(--color-primary) 100%, transparent)',
              fill: 'color-mix(in oklab, var(--color-primary) 40%, transparent)',
            },
          ],
        },
      ]}
      chartData={chartData}
    />
  );
};

export const LoadingActivityCharts = () => {
  return <LoadingCharts tabs={['profit', 'tokens', 'transactions']} />;
};
