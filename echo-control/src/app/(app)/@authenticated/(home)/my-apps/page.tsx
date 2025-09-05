import { Body, Heading } from '../../_components/layout/page-utils';
import { MyApps } from './_components/apps';

import { NewAppButton } from './_components/new-app-button';

import { api, HydrateClient } from '@/trpc/server';

export default function MyAppsPage() {
  api.apps.list.owner.prefetchInfinite({
    page_size: 6,
  });

  return (
    <HydrateClient>
      <Heading
        title="My Apps"
        description="Applications that you own and manage"
        actions={<NewAppButton />}
      />
      <Body>
        <MyApps />
      </Body>
    </HydrateClient>
  );
}
