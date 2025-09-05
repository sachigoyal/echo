import { Body, Heading } from '../../_components/layout/page-utils';

import { api, HydrateClient } from '@/trpc/server';
import { ActivityList } from './_components/list';
import { FiltersContextProvider } from './contexts/filters-context';
import { ActivityFilters } from './_components/filters';

export default function ActivityPage() {
  api.apps.list.owner.prefetchInfinite({});
  api.user.feed.list.prefetchInfinite({
    limit: 10,
    numHours: 4,
  });

  return (
    <HydrateClient>
      <Heading
        title="Activity"
        description="Here's what's been happening with your apps"
      />
      <Body className="gap-4">
        <FiltersContextProvider>
          <ActivityFilters />
          <ActivityList />
        </FiltersContextProvider>
      </Body>
    </HydrateClient>
  );
}
