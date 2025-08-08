'use client';

import React from 'react';
import Link from 'next/link';
import { useTRPCCustomerApps } from '@/hooks';
import BaseAppsPage from './BaseAppsPage';

export const MemberAppsPage: React.FC = () => {
  // Use TRPC hook to fetch customer apps
  const { apps, isLoading, error } = useTRPCCustomerApps({
    initialLimit: 100,
  });

  // Sort by creation date (newest first)
  const sortedApps = [...apps].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const emptyStateContent = (
    <>
      <p className="text-muted-foreground mb-4">No member apps found.</p>
      <Link href="/apps/popular-apps" className="text-primary hover:underline">
        Browse popular apps
      </Link>
    </>
  );

  return (
    <BaseAppsPage
      title="Apps I'm Using"
      description="Applications where you have membership access"
      apps={sortedApps}
      isLoading={isLoading}
      error={error}
      emptyStateContent={emptyStateContent}
    />
  );
};

export default MemberAppsPage;
