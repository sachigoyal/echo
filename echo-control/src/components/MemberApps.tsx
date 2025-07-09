'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { AppRole } from '@/lib/permissions/types';
import { AuthenticatedEchoApp } from '@/lib/types/apps';
import AppPreviewList from './AppPreviewList';

export const MemberApps: React.FC = () => {
  const { isLoaded } = useUser();
  const [memberApps, setMemberApps] = useState<AuthenticatedEchoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      fetchMemberApps();
    }
  }, [isLoaded]);

  const fetchMemberApps = async () => {
    try {
      setError(null);
      const response = await fetch('/api/apps');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch echo apps');
      }

      const allApps = (data.apps || []) as AuthenticatedEchoApp[];

      // Filter for apps where user is a member but not the owner
      const membershipApps = allApps
        .filter(app => app.isActive && app.userRole !== AppRole.OWNER)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setMemberApps(membershipApps);
    } catch (error) {
      console.error('Error fetching member apps:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch member apps'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppPreviewList
      title="Apps I'm Using"
      description="Applications where you have membership access"
      apps={memberApps}
      href="/apps/member-apps"
      loading={loading}
      error={error}
      emptyStateMessage="No member apps found"
    />
  );
};

export default MemberApps;
