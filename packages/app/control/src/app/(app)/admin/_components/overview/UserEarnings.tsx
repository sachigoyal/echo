'use client';

import { OverviewPanel } from '@/components/overview-panel/OverviewPanel';
import { api } from '@/trpc/client';

export function UserEarningsOverview() {
  const { data, isLoading, error } =
    api.admin.earnings.getUserEarningsOverviewMetrics.useQuery();

  return (
    <OverviewPanel
      title="User Earnings Overview"
      description="Summary statistics for user earnings"
      metrics={data || []}
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
