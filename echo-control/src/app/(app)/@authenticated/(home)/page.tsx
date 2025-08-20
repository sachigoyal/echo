import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { api } from '@/trpc/server';
import { AppCard, AppCardSkeleton } from '../_components/apps/card';

export default async function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 container">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage your apps and API keys
        </p>
        <ErrorBoundary fallback={<p>There was an error loading your apps</p>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Suspense
              fallback={Array.from({ length: 5 }).map((_, i) => (
                <AppCardSkeleton key={i} />
              ))}
            >
              <AppsGrid />
            </Suspense>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
}

const AppsGrid = async () => {
  const apps = await api.apps.owner.list();

  return apps.map(app => <AppCard key={app.id} {...app} />);
};
