'use client';

import React, { useEffect, useState } from 'react';
import { EchoApp } from '@/lib/types/echo-app';
import AppPreviewList from './AppPreviewList';

export const PopularApps: React.FC = () => {
  const [apps, setApps] = useState<EchoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularApps = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/apps/public');
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        const data = await response.json();
        const popularApps = data.apps.filter((app: EchoApp) => app.isActive);
        setApps(popularApps);
      } catch (error) {
        console.error('Error fetching popular apps:', error);
        setError('Failed to fetch popular apps.');
        setApps([]); // Clear apps on error
      } finally {
        setLoading(false);
      }
    };

    fetchPopularApps();
  }, []);

  return (
    <AppPreviewList
      title="Popular Apps"
      description="Most used applications by the Echo community"
      apps={apps}
      href="/apps/popular-apps"
      loading={loading}
      error={error}
      emptyStateMessage="Could not load popular apps at this time."
    />
  );
};

export default PopularApps;
