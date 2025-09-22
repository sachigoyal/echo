'use client';

import { OverviewPanel } from '@/components/overview-panel/OverviewPanel';
import { api } from '@/trpc/client';

export function AppEarningsOverview() {
  const { data, isLoading, error } =
    api.admin.earnings.getAppEarningsOverviewMetrics.useQuery();

  return (
    <OverviewPanel
      title="App Earnings Overview"
      description="Summary statistics for app revenues and usage"
      metrics={data ?? []}
      isLoading={isLoading}
      error={error}
      grid={{
        columns: 3,
        gap: 'md',
        responsive: true,
      }}
      className="mb-8"
    />
  );
}
