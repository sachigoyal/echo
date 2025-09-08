import { Suspense } from 'react';

import { Body, Heading } from '../../../_components/layout/page-utils';

import { Balance } from './_components/balance';
import { Payments } from './_components/payments';
import { Details, LoadingFreeTierDetails } from './_components/details';

import { api, HydrateClient } from '@/trpc/server';
import {
  FreeTierUsersTable,
  LoadingFreeTierUsersTable,
} from './_components/users';

export default async function FreeTierPage({
  params,
}: PageProps<'/app/[id]/free-tier'>) {
  const { id } = await params;

  api.apps.app.freeTier.payments.list.prefetchInfinite({
    appId: id,
  });
  api.apps.app.freeTier.get.prefetch({
    appId: id,
  });
  api.apps.app.freeTier.users.list.prefetchInfinite({
    appId: id,
  });

  return (
    <HydrateClient>
      <Heading
        title="Free Tier"
        description="Allow your users to test out your app for free before they have to buy credits and spend their echo balance."
      />
      <Body>
        <div className="flex flex-col gap-2">
          <Balance appId={id} />
          <Suspense fallback={<LoadingFreeTierDetails />}>
            <Details appId={id} />
          </Suspense>
        </div>
        <Suspense fallback={<LoadingFreeTierUsersTable />}>
          <FreeTierUsersTable appId={id} />
        </Suspense>
        <Payments appId={id} />
      </Body>
    </HydrateClient>
  );
}
