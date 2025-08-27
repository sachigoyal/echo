import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { endOfDay, subDays } from 'date-fns';

import { Card } from '@/components/ui/card';

import { api, HydrateClient } from '@/trpc/server';

import { RangeSelector } from '../../../../../../_components/time-range-selector/range-selector';
import { ActivityCharts, LoadingActivityCharts } from './charts';
import { ActivityContextProvider } from '../../../../../../_components/time-range-selector/context';
import { ActivityOverlay } from './overlay';

interface Props {
  appId: string;
}

export const Activity: React.FC<Props> = ({ appId }) => {
  const defaultStartDate = subDays(new Date(), 7);
  const defaultEndDate = endOfDay(new Date());

  api.apps.app.activity.get.prefetch({
    appId,
    startDate: defaultStartDate,
    endDate: defaultEndDate,
  });

  return (
    <HydrateClient>
      <ActivityContextProvider
        initialStartDate={defaultStartDate}
        initialEndDate={defaultEndDate}
      >
        <div className="w-full flex flex-col gap-4 md:gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">App Activity</h3>
            <RangeSelector />
          </div>
          <Card className="p-0 overflow-hidden relative">
            <ErrorBoundary
              fallback={<p>There was an error loading the activity data</p>}
            >
              <Suspense fallback={<LoadingActivityCharts />}>
                <ActivityCharts appId={appId} />
              </Suspense>
            </ErrorBoundary>
            <ActivityOverlay appId={appId} />
          </Card>
        </div>
      </ActivityContextProvider>
    </HydrateClient>
  );
};
