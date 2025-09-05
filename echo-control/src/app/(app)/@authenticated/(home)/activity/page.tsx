import { Body, Heading } from '../../_components/layout/page-utils';

import { api, HydrateClient } from '@/trpc/server';
import { ActivityList } from './_components/list';

export default function ActivityPage() {
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
      <Body>
        <ActivityList />
      </Body>
    </HydrateClient>
  );
}
