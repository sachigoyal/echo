import { Suspense } from 'react';

import { Body, Heading } from '../../../_components/layout/page-utils';

import { Balance } from './_components/balance';
import { Payments } from './_components/payments';
import { Details, LoadingFreeTierDetails } from './_components/details';

import { api } from '@/trpc/server';

export default async function FreeTierPage({
  params,
}: PageProps<'/app/[id]/free-tier'>) {
  const { id } = await params;

  api.apps.app.freeTier.payments.list.prefetchInfinite({
    cursor: 0,
    appId: id,
  });

  api.apps.app.freeTier.get.prefetch({
    appId: id,
  });

  return (
    <div>
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
        <Payments appId={id} />
      </Body>
    </div>
  );
}
