'use client';

import React, { useEffect, useState } from 'react';
import { PublicEchoApp } from '@/lib/types/apps';
import AppPreviewList from './AppPreviewList';

export const PopularApps: React.FC = () => {
  const [apps, setApps] = useState<PublicEchoApp[]>([]);
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
        const popularApps = (data.apps as PublicEchoApp[]).filter(
          app => app.isActive
        );
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
