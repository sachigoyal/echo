'use client';

import React, { useState, useEffect } from 'react';
import AllAppsPage from '@/components/AllAppsPage';
import { usePublicApps } from '@/hooks/usePublicApps';
import { PublicEchoApp } from '@/lib/types/apps';

const PopularAppsFullPage: React.FC = () => {
  const [apps, setApps] = useState<PublicEchoApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularApps = async () => {
      setLoading(true);
      setError(null);
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
    <AllAppsPage
      title="Popular Apps"
      description="Most used applications by the Echo community"
      fetchApps={() => Promise.resolve(apps)}
      emptyStateMessage="No popular apps found at this time."
    />
  );
};

export default PopularAppsFullPage;
