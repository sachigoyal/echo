'use client';

import React from 'react';
import Link from 'next/link';
import { useTRPCPublicApps } from '@/hooks';
import AppCard from './AppCard';
import { Marquee } from './ui/marquee';
import { Skeleton } from './ui/skeleton';

export const PopularApps: React.FC = () => {
  // Use TRPC hook to fetch public apps with a large limit for marquee
  const { apps, isLoading, error } = useTRPCPublicApps({
    initialLimit: 100,
  });

  if (isLoading) {
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
            <Skeleton key={index} className="h-[220px] w-[300px] shrink-0" />
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
          <div className="text-sm text-red-700 dark:text-red-300">
            {(error as Error).message}
          </div>
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
              activityData={
                app.stats?.globalActivityData?.map(d => d.totalTokens) || []
              }
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
