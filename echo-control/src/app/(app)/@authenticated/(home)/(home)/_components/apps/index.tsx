import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import {
  AppCard,
  AppCardSkeleton,
} from '@/app/(app)/@authenticated/_components/apps/card';

import { api } from '@/trpc/server';

export const Apps = () => {
  return (
    <div className="w-full flex flex-col gap-4 md:gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">Your Apps</h3>
      </div>
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
  );
};

export const AppsGrid = async () => {
  const apps = await api.apps.owner.list();

  return apps.map(app => <AppCard key={app.id} {...app} />);
};
