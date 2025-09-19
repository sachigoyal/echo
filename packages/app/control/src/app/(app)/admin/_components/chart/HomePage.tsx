'use client';

import { ChartPanel } from '@/components/overview-chart/ChartPanel';
import { api } from '@/trpc/client';

export default function HomePageChart() {
  const { data, isLoading, error } =
    api.admin.tokens.getHomePageChart.useQuery();

  return (
    <ChartPanel
      charts={data || []}
      isLoading={isLoading}
      error={error}
      grid={{ columns: 2, gap: 'md', responsive: true }}
      className="mb-8"
    />
  );
}
