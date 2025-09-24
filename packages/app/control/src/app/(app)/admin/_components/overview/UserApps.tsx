'use client';

import { OverviewPanel } from '@/components/overview-panel/OverviewPanel';
import { api } from '@/trpc/client';

interface UserAppsOverviewProps {
  userId: string;
}

export function UserAppsOverview({ userId }: UserAppsOverviewProps) {
  const { data, isLoading, error } =
    api.admin.user.getUserOverviewMetrics.useQuery({ userId });

  return (
    <OverviewPanel
      title="User Overview"
      description="Summary statistics for this user's activity and performance"
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
