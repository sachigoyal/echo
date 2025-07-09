'use client';

import React from 'react';
import { AuthenticatedEchoApp } from '@/lib/types/apps';
import AllAppsPage from '@/components/AllAppsPage';

const MemberAppsFullPage: React.FC = () => {
  const fetchMemberApps = async (): Promise<AuthenticatedEchoApp[]> => {
    const response = await fetch('/api/apps');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch echo apps');
    }

    const allApps = (data.apps || []) as AuthenticatedEchoApp[];
    return allApps.sort(
      (a: AuthenticatedEchoApp, b: AuthenticatedEchoApp) =>
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
