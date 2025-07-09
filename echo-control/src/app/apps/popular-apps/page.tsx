'use client';

import React from 'react';
import { EchoApp } from '@/lib/types/echo-app';
import AllAppsPage from '@/components/AllAppsPage';

const PopularAppsFullPage: React.FC = () => {
  const fetchPopularApps = async (): Promise<EchoApp[]> => {
    const response = await fetch('/api/apps/public');
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }

    return data.apps.filter((app: EchoApp) => app.isActive);
  };

  return (
    <AllAppsPage
      title="Popular Apps"
      description="Most used applications by the Echo community"
      fetchApps={fetchPopularApps}
      emptyStateMessage="No popular apps found at this time."
    />
  );
};

export default PopularAppsFullPage;
