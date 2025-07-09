'use client';

import React from 'react';
import { AppRole } from '@/lib/permissions/types';
import { EchoApp } from '@/lib/types/echo-app';
import AllAppsPage from '@/components/AllAppsPage';

const MyAppsFullPage: React.FC = () => {
  const fetchMyApps = async (): Promise<EchoApp[]> => {
    const response = await fetch('/api/owner/apps');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch echo apps');
    }

    const allApps = data.apps || [];
    return allApps.filter((app: EchoApp) => app.userRole === AppRole.OWNER);
  };

  return (
    <AllAppsPage
      title="Your Apps"
      description="Applications you've created and manage"
      fetchApps={fetchMyApps}
      emptyStateMessage="You haven't created any apps yet."
    />
  );
};

export default MyAppsFullPage;
