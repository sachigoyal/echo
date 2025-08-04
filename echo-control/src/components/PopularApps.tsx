'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicEchoApp } from '@/lib/types/apps';
import AppCard from './AppCard';
import { Marquee } from './ui/marquee';
import { Skeleton } from './skeleton';

export const PopularApps: React.FC = () => {
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

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Popular Apps</h2>
          <p className="text-muted-foreground">
            Most used applications by the Echo community
          </p>
        </div>
        <div className="flex gap-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton
              key={index}
              className="h-[220px] w-[300px] flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="mb-6 text-center">
          <Link href="/apps/popular-apps">
            <h2 className="text-2xl font-bold mb-2 hover:underline">
              Popular Apps
            </h2>
          </Link>
          <p className="text-muted-foreground">
            Most used applications by the Echo community
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-6 text-center">
          <Link href="/apps/popular-apps">
            <h2 className="text-2xl font-bold mb-2 hover:underline">
              Popular Apps
            </h2>
          </Link>
          <p className="text-muted-foreground">
            Most used applications by the Echo community
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Could not load popular apps at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <Link href="/apps/popular-apps">
          <h2 className="text-2xl font-bold mb-2 hover:underline">
            Popular Apps
          </h2>
        </Link>
        <p className="text-muted-foreground">
          Most used applications by the Echo community
        </p>
      </div>

      <Marquee className="[--duration:20s]" pauseOnHover={true}>
        {apps.map(app => (
          <div key={app.id} className="mx-2 w-full">
            <AppCard
              app={app}
              href={`/apps/${app.id}`}
              activityData={app.activityData || []}
              size="medium"
              showChart={true}
            />
          </div>
        ))}
      </Marquee>
    </div>
  );
};

export default PopularApps;
