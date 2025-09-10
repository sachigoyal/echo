'use client';

import { Charts } from '@/app/(app)/_components/charts';
import { ChartData } from '@/app/(app)/_components/charts/base-chart';
import { format, subDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

const simulateActivityData = (): ChartData<{
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalProfit: number;
  transactionCount: number;
}>[] => {
  const activity: ChartData<{
    totalCost: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalProfit: number;
    transactionCount: number;
  }>[] = [];

  // Constants for realistic simulation
  const MARKUP_PERCENTAGE = 0.25; // 25% markup for profit calculation
  const BASE_COST_PER_TOKEN = 0.002; // Base cost per token in dollars
  const COST_VARIANCE = 0.3; // 30% variance in daily costs
  const TRANSACTION_VARIANCE = 0.4; // 40% variance in transaction count

  let baseCost = 50; // Starting base cost in dollars
  let baseTransactionCount = 25; // Starting base transaction count

  for (let i = 48; i >= 0; i--) {
    const date = subDays(new Date(), i);

    // Generate realistic variations
    const costMultiplier = 1 + (Math.random() - 0.5) * 2 * COST_VARIANCE;
    const transactionMultiplier =
      1 + (Math.random() - 0.5) * 2 * TRANSACTION_VARIANCE;

    // Calculate correlated values
    const totalCost = Math.max(
      5,
      Math.round(baseCost * costMultiplier * 100) / 100
    );
    const transactionCount = Math.max(
      1,
      Math.round(baseTransactionCount * transactionMultiplier)
    );

    // Calculate tokens based on cost (realistic token distribution)
    const totalTokens = Math.round(totalCost / BASE_COST_PER_TOKEN);

    // Input/Output token ratio (typically 60/40 split)
    const inputRatio = 0.6 + (Math.random() - 0.5) * 0.2; // 50-70% input tokens
    const totalInputTokens = Math.round(totalTokens * inputRatio);
    const totalOutputTokens = totalTokens - totalInputTokens;

    // Calculate profit based on constant markup percentage
    const totalProfit = Math.round(totalCost * MARKUP_PERCENTAGE * 100) / 100;

    activity.push({
      timestamp: format(date, 'MMM dd'),
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalProfit,
      transactionCount,
    });

    // Gradually adjust base values for realistic trending
    baseCost += (Math.random() - 0.5) * 2; // Slight drift in base cost
    baseTransactionCount += (Math.random() - 0.5) * 1; // Slight drift in transaction count
  }

  return activity;
};

export const BillingSectionCharts = () => {
  const [data, setData] = useState<
    ChartData<{
      totalCost: number;
      totalTokens: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      totalProfit: number;
      transactionCount: number;
    }>[]
  >(() => simulateActivityData());

  useEffect(() => {
    setData(simulateActivityData());
  }, []);

  const totalProfit = data.reduce((sum, item) => sum + item.totalProfit, 0);
  const totalTokens = data.reduce((sum, item) => sum + item.totalTokens, 0);
  const totalTransactions = data.reduce(
    (sum, item) => sum + item.transactionCount,
    0
  );
  const numTokens = totalTokens;

  return (
    <Card className="overflow-hidden w-full">
      <Charts
        chartData={data}
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
              amount:
                numTokens === 0
                  ? '--'
                  : totalTokens.toLocaleString(undefined, {
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
              amount:
                numTokens === 0
                  ? '--'
                  : totalTransactions.toLocaleString(undefined, {
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
      />
    </Card>
  );
};
