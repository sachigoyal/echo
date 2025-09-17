'use client';

import { ChartPanel } from '@/components/overview-chart/ChartPanel';
import { api } from '@/trpc/client';

export default function TotalTokensChart() {
  const { data, isLoading, error } = api.admin.tokens.getTotalTokensChart.useQuery();

  return (
    <ChartPanel
      charts={data || []}
      isLoading={isLoading}
      error={error}
      grid={{ columns: 1, gap: 'md', responsive: true }}
      className="mb-8"
    />
  );
}