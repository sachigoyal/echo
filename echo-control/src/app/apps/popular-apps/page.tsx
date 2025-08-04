'use client';

import React from 'react';
import AllAppsPage from '@/components/AllAppsPage';
import { usePublicApps } from '@/hooks/usePublicApps';

const PopularAppsFullPage: React.FC = () => {
  const { fetchPublicApps } = usePublicApps();

  // Wrapper function to match AllAppsPage interface
  const fetchAppsWrapper = async () => {
    // Fetch all popular apps with a large limit
    return await fetchPublicApps(1, 100);
  };

  return (
    <AllAppsPage
      title="Popular Apps"
      description="Most used applications by the Echo community"
      fetchApps={fetchAppsWrapper}
      emptyStateMessage="No popular apps found at this time."
    />
  );
};

export default PopularAppsFullPage;
