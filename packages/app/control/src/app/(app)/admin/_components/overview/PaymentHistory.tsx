'use client';

import React from 'react';
import { OverviewPanel } from '@/components/overview-panel/OverviewPanel';
import { api } from '@/trpc/client';

export function PaymentsOverview() {
  const { data, isLoading, error } =
    api.admin.payments.getPaymentsOverviewMetrics.useQuery();

  return (
    <OverviewPanel
      title="Payments Overview"
      description="How users are paying into the platform"
      metrics={data || []}
      isLoading={isLoading}
      error={error}
      grid={{ columns: 3, gap: 'md', responsive: true }}
      className="mb-8"
    />
  );
}
