'use client';

import React from 'react';
import { useTRPCPublicApps } from '@/hooks';
import BaseAppsPage from './BaseAppsPage';

export const PopularAppsPage: React.FC = () => {
  // Use TRPC hook to fetch public apps
  const { apps, isLoading, error } = useTRPCPublicApps({
    initialLimit: 100,
  });

  const emptyStateContent = (
    <p className="text-muted-foreground mb-4">
      No popular apps found at this time.
    </p>
  );

  return (
    <BaseAppsPage
      title="Popular Apps"
      description="Most used applications by the Echo community"
      apps={apps}
      isLoading={isLoading}
      error={error}
      emptyStateContent={emptyStateContent}
    />
  );
};

export default PopularAppsPage;
