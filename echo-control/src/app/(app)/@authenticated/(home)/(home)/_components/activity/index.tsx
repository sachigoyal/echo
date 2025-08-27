import React, { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { endOfDay, subDays } from 'date-fns';

import { Card } from '@/components/ui/card';

import { api, HydrateClient } from '@/trpc/server';

import { RangeSelector } from '@/app/(app)/@authenticated/_components/time-range-selector/range-selector';
import { ActivityContextProvider } from '@/app/(app)/@authenticated/_components/time-range-selector/context';

import { ActivityCharts, LoadingActivityCharts } from './charts';
import { ActivityOverlay } from './overlay';

export const Activity: React.FC = () => {
  const defaultStartDate = subDays(new Date(), 7);
  const defaultEndDate = endOfDay(new Date());

  api.activity.creator.getCurrent.prefetch({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });
  api.apps.count.owner.prefetch();

  return (
    <HydrateClient>
      <ActivityContextProvider
        initialStartDate={defaultStartDate}
        initialEndDate={defaultEndDate}
      >
        <div className="w-full flex flex-col gap-2 md:gap-3 max-w-full">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Your Earnings</h3>
            <RangeSelector />
          </div>
          <Card className="p-0 overflow-hidden relative">
            <ErrorBoundary
              fallback={<p>There was an error loading the activity data</p>}
            >
              <Suspense fallback={<LoadingActivityCharts />}>
                <ActivityCharts />
              </Suspense>
            </ErrorBoundary>
            <Suspense fallback={null}>
              <ErrorBoundary fallback={null}>
                <ActivityOverlay />
              </ErrorBoundary>
            </Suspense>
          </Card>
        </div>
      </ActivityContextProvider>
    </HydrateClient>
  );
};
