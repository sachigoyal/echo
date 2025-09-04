import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { Card } from '@/components/ui/card';

import { AppRows, LoadingAppRows } from './rows';

const AppsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex flex-col gap-2 md:gap-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Your Apps</h3>
      </div>
      <Card className="overflow-hidden relative">{children}</Card>
    </div>
  );
};

export const Apps = () => {
  return (
    <AppsContainer>
      <ErrorBoundary fallback={<p>There was an error loading your apps</p>}>
        <div className="flex flex-col">
          <Suspense fallback={<LoadingAppRows />}>
            <AppRows />
          </Suspense>
        </div>
      </ErrorBoundary>
    </AppsContainer>
  );
};

export const LoadingAppsSection = () => {
  return (
    <AppsContainer>
      <LoadingAppRows />
    </AppsContainer>
  );
};
