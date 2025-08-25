'use client';

import { format } from 'date-fns';
import {
  Charts,
  LoadingCharts,
} from '@/app/(app)/@authenticated/_components/charts';
import { ChartData } from '@/app/(app)/@authenticated/_components/charts/base-chart';

import { api } from '@/trpc/client';
import { useActivityContext } from '@/app/(app)/@authenticated/_components/time-range-selector/context';

import { formatCurrency } from '@/lib/utils';

export const ActivityCharts: React.FC = () => {
  const { startDate, endDate } = useActivityContext();

  const [activity] = api.activity.creator.getCurrent.useSuspenseQuery({
    startDate,
    endDate,
  });

  // Transform data for the chart
  const chartData: ChartData<Omit<(typeof activity)[number], 'timestamp'>>[] =
    activity.map(({ timestamp, ...rest }) => ({
      ...rest,
      timestamp: format(timestamp, 'MMM dd HH:mm yyyy'),
    }));

  const totalProfit = activity.reduce((acc, item) => acc + item.totalProfit, 0);
  const totalTokens = activity.reduce((acc, item) => acc + item.totalTokens, 0);
  const totalTransactions = activity.reduce(
    (acc, item) => acc + item.transactionCount,
    0
  );

  return (
    <Charts
      tabs={[
        {
          trigger: {
            value: 'profit',
            label: 'Profit',
            amount: formatCurrency(totalProfit),
          },
          bars: [
            {
              dataKey: 'totalCost',
              color:
                'color-mix(in oklab, var(--color-muted-foreground) 40%, transparent)',
            },
            {
              dataKey: 'totalProfit',
              color: 'var(--color-primary)',
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
          bars: [
            {
              dataKey: 'totalInputTokens',
              color:
                'color-mix(in oklab, var(--color-primary) 40%, transparent)',
            },
            {
              dataKey: 'totalOutputTokens',
              color:
                'color-mix(in oklab, var(--color-primary) 100%, transparent)',
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
          bars: [
            {
              dataKey: 'transactionCount',
              color: 'var(--color-primary)',
            },
          ],
          tooltipRows: [
            {
              key: 'transactionCount',
              label: 'Transactions',
              getValue: data =>
                data.toLocaleString(undefined, {
                  notation: 'compact',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }),
            },
          ],
        },
      ]}
      chartData={chartData}
    />
  );
};

export const LoadingActivityCharts = () => {
  return <LoadingCharts tabs={['Profit', 'Tokens', 'Transactions']} />;
};
