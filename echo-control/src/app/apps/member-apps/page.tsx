'use client';

import React from 'react';
import { EchoApp } from '@/lib/types/echo-app';
import AllAppsPage from '@/components/AllAppsPage';

const MemberAppsFullPage: React.FC = () => {
  const fetchMemberApps = async (): Promise<EchoApp[]> => {
    const response = await fetch('/api/apps');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch echo apps');
    }

    const allApps = data.apps || [];
    return allApps.sort(
      (a: EchoApp, b: EchoApp) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  return (
    <AllAppsPage
      title="Apps I'm Using"
      description="Applications where you have membership access"
      fetchApps={fetchMemberApps}
      emptyStateMessage="No member apps found."
    />
  );
};

export default MemberAppsFullPage;
