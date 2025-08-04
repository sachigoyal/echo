'use client';

import React from 'react';
import AllAppsPage from '@/components/AllAppsPage';
import { PublicEchoApp } from '@/lib/types/apps';

const PopularAppsFullPage: React.FC = () => {
  const fetchPopularApps = async () => {
    try {
      // Fetch all popular apps (large limit for marquee display)
      const response = await fetch('/api/apps/public?limit=100');
      if (!response.ok) {
        throw new Error('Network response was not ok.');
      }
      const data = await response.json();
      const popularApps = (data.apps as PublicEchoApp[]).filter(
        app => app.isActive
      );
      return popularApps;
    } catch (error) {
      console.error('Error fetching popular apps:', error);
      return [];
    }
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
