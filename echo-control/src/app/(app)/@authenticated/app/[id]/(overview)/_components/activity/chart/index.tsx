'use client';

import { api } from '@/trpc/client';
import { Area, Bar } from 'recharts';
import { format } from 'date-fns';
import { BaseChart } from './base';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { useActivityContext } from '../context';

interface Props {
  appId: string;
}

export const Chart: React.FC<Props> = ({ appId }) => {
  const { startDate, endDate } = useActivityContext();

  const [activitya] = api.activity.app.get.useSuspenseQuery({
    echoAppId: appId,
    startDate,
    endDate,
  });

  //   // Transform data for the chart
  //   const chartData = activity.map(item => ({
  //     ...item,
  //     timestamp: format(new Date(item.timestamp), 'MMM dd HH:mm'),
  //   }));

  // Simulate 20 buckets of activity data for testing
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

  const totalProfit = activity.reduce((acc, item) => acc + item.totalProfit, 0);
  const totalTokens = activity.reduce((acc, item) => acc + item.totalTokens, 0);
  const totalTransactions = activity.reduce(
    (acc, item) => acc + item.totalTransactions,
    0
  );

  const chartData = activity.map(item => ({
    timestamp: format(item.bucketDate, 'MMM dd HH:mm'),
    ...item,
  }));

  return (
    <Tabs defaultValue="profit">
      <TabsList>
        <TabsTrigger
          value="profit"
          label="Profit"
          amount={totalProfit.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
            notation: 'compact',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
        <TabsTrigger
          value="tokens"
          label="Tokens"
          amount={totalTokens.toLocaleString(undefined, {
            notation: 'compact',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
        <TabsTrigger
          value="transactions"
          label="Transactions"
          amount={totalTransactions.toLocaleString(undefined, {
            notation: 'compact',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        />
      </TabsList>
      <TabsContent value="profit">
        <BaseChart data={chartData}>
          <Area
            type="monotone"
            dataKey="totalCost"
            stackId="1"
            stroke="color-mix(in oklab, var(--color-neutral-500) 60%, transparent)"
            fill="color-mix(in oklab, var(--color-neutral-500) 20%, transparent)"
          />
          <Area
            type="monotone"
            dataKey="totalProfit"
            stackId="1"
            stroke="color-mix(in oklab, var(--color-primary) 100%, transparent)"
            fill="color-mix(in oklab, var(--color-primary) 60%, transparent)"
          />
        </BaseChart>
      </TabsContent>
      <TabsContent value="tokens">
        <BaseChart data={chartData}>
          <Area
            type="monotone"
            dataKey="totalInputTokens"
            stackId="1"
            stroke="color-mix(in oklab, var(--color-primary) 100%, transparent)"
            fill="color-mix(in oklab, var(--color-primary) 20%, transparent)"
          />
          <Area
            type="monotone"
            dataKey="totalOutputTokens"
            stackId="1"
            stroke="color-mix(in oklab, var(--color-primary) 100%, transparent)"
            fill="color-mix(in oklab, var(--color-primary) 40%, transparent)"
          />
        </BaseChart>
      </TabsContent>
      <TabsContent value="transactions">
        <BaseChart data={chartData}>
          <Area
            type="monotone"
            dataKey="totalTransactions"
            stackId="1"
            stroke="color-mix(in oklab, var(--color-primary) 100%, transparent)"
            fill="color-mix(in oklab, var(--color-primary) 40%, transparent)"
          />
        </BaseChart>
      </TabsContent>
    </Tabs>
  );
};
