'use client';

import { OverviewPanel } from '@/components/overview-panel/OverviewPanel';
import { api } from '@/trpc/client';

export function UserSpendingOverview() {
  const { data, isLoading, error } =
    api.admin.spending.getUserSpendingOverviewMetrics.useQuery();

  return (
    <OverviewPanel
      title="User Spending Overview"
      description="Summary statistics for how users are spending"
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
