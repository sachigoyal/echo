'use client';

import React, { ReactNode } from 'react';
import AppCard from './AppCard';
import { Skeleton } from './skeleton';
import { EchoApp } from '@/lib/types/apps';

interface BaseAppsPageProps {
  title: string;
  description: string;
  apps: EchoApp[];
  isLoading: boolean;
  error: unknown;
  emptyStateContent?: ReactNode;
  headerAction?: ReactNode;
}

export const BaseAppsPage: React.FC<BaseAppsPageProps> = ({
  title,
  description,
  apps,
  isLoading,
  error,
  emptyStateContent,
  headerAction,
}) => {
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {headerAction}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, index) => (
            <Skeleton key={index} className="h-[220px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {headerAction}
        </div>
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="text-sm text-red-700 dark:text-red-300">
            Failed to load apps: {(error as Error).message}
          </div>
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {headerAction}
        </div>
        <div className="text-center py-12">{emptyStateContent}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {headerAction}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {apps.map(app => (
          <AppCard
            key={app.id}
            app={app}
            href={`/apps/${app.id}`}
            activityData={
              app.stats?.globalActivityData?.map(d => d.totalTokens) || []
            }
            size="medium"
            showChart={true}
          />
        ))}
      </div>
    </div>
  );
};

export default BaseAppsPage;
