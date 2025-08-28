import { Heading, Body } from '../../../_components/layout/page-utils';

import { GenerateKey } from './_components/generate-key';
import { Keys } from './_components/keys';

import { api, HydrateClient } from '@/trpc/server';

export default async function AppKeysPage({
  params,
  searchParams,
}: PageProps<'/app/[id]/keys'>) {
  const { id } = await params;
  const { generate } = await searchParams;

  api.user.apiKeys.list.prefetchInfinite({ appId: id });

  return (
    <HydrateClient>
      <Heading
        title="API Keys"
        actions={<GenerateKey appId={id} generate={Boolean(generate)} />}
      />
      <Body>
        <Keys appId={id} />
      </Body>
    </HydrateClient>
  );
}
