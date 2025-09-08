import { Heading, Body } from '../../_components/layout/page-utils';

import { api, HydrateClient } from '@/trpc/server';

import { Keys } from './_components/keys';

import { GenerateKey } from './_components/generate-key';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Keys',
};

export default async function KeysPage() {
  api.user.apiKeys.list.prefetchInfinite({});
  api.apps.list.member.prefetchInfinite({});

  return (
    <HydrateClient>
      <Heading
        title="API Keys"
        description="All of the API keys that you have generated"
        actions={<GenerateKey />}
      />
      <Body>
        <Keys />
      </Body>
    </HydrateClient>
  );
}
