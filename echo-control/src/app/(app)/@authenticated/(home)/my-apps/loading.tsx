import { Body, Heading } from '../../_components/layout/page-utils';

import { LoadingApps } from './_components/apps';

import { HydrateClient } from '@/trpc/server';

export default function MyAppsLoadingPage() {
  return (
    <HydrateClient>
      <Heading
        title="My Apps"
        description="Applications that you own and manage"
      />
      <Body>
        <LoadingApps />
      </Body>
    </HydrateClient>
  );
}
