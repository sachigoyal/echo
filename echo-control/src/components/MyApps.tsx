'use client';

import React, { useState, useEffect } from 'react';

import { AuthenticatedEchoApp } from '@/lib/types/apps';
import AppPreviewList from './AppPreviewList';

import { useUser } from '@/hooks/use-user';

import { AppRole } from '@/lib/permissions/types';

export const MyApps: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [userApps, setUserApps] = useState<AuthenticatedEchoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchApps();
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const fetchApps = async () => {
    try {
      setError(null);
      const response = await fetch('/api/owner/apps');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch echo apps');
      }

      const allApps = (data.apps || []) as AuthenticatedEchoApp[];

      // Filter for owner apps
      const owner = allApps.filter(app => app.userRole === AppRole.OWNER);

      setUserApps(owner);
    } catch (error) {
      console.error('Error fetching echo apps:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch echo apps'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppPreviewList
      title="Your Apps"
      description="Applications you've created and manage"
      apps={userApps}
      href="/apps/my-apps"
      loading={loading}
      error={error}
      emptyStateMessage="You haven't created any apps yet"
    />
  );
};

export default MyApps;
