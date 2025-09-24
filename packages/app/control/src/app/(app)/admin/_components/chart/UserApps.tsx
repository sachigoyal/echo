'use client';

import React from 'react';
import { ChartPanel } from '@/components/overview-chart/ChartPanel';
import { api } from '@/trpc/client';

interface UserAppsChartProps {
  userId: string;
}

export function UserAppsChart({ userId }: UserAppsChartProps) {
  const { data, isLoading, error } = api.admin.user.getUserAppsCharts.useQuery({
    userId,
  });

  return (
    <ChartPanel
      title="User App Charts"
      description="Time series for markup profit and transactions across this user's apps"
      charts={data ?? []}
      isLoading={isLoading}
      error={error}
      grid={{ columns: 2, gap: 'md', responsive: true }}
      className="mb-8"
    />
  );
}
