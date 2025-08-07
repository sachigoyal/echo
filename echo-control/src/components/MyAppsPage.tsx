'use client';

import React from 'react';
import { useTRPCOwnerApps } from '@/hooks';
import BaseAppsPage from './BaseAppsPage';

export const MyAppsPage: React.FC = () => {
  // Use TRPC hook to fetch owner apps
  const { apps, isLoading, error } = useTRPCOwnerApps({
    initialLimit: 100,
  });

  const emptyStateContent = (
    <>
      <p className="text-muted-foreground mb-6">
        You haven&apos;t created any apps yet.
      </p>
    </>
  );

  return (
    <BaseAppsPage
      title="Your Apps"
      description="Applications you've created and manage"
      apps={apps}
      isLoading={isLoading}
      error={error}
      emptyStateContent={emptyStateContent}
    />
  );
};

export default MyAppsPage;
