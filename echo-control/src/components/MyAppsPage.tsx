'use client';

import React from 'react';
import Link from 'next/link';
import { useTRPCOwnerApps } from '@/hooks';
import BaseAppsPage from './BaseAppsPage';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

export const MyAppsPage: React.FC = () => {
  // Use TRPC hook to fetch owner apps
  const { apps, isLoading, error } = useTRPCOwnerApps({
    initialLimit: 100,
  });

  const emptyStateContent = (
    <>
      <p className="text-muted-foreground mb-6">
        You haven&apos;t created any apps yet.
      </p>
      <Link href="/apps/new">
        <Button size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Your First App
        </Button>
      </Link>
    </>
  );

  return (
    <BaseAppsPage
      title="Your Apps"
      description="Applications you've created and manage"
      apps={apps}
      isLoading={isLoading}
      error={error}
      emptyStateContent={emptyStateContent}
    />
  );
};

export default MyAppsPage;
