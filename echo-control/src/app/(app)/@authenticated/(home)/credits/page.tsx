import { redirect } from 'next/navigation';

import { Payments } from './_components/payments';

import { Heading, Body } from '../../_components/layout/page-utils';

import { Balance } from './_components/balance';

import { auth } from '@/auth';

import { api, HydrateClient } from '@/trpc/server';

export default async function CreditsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login?redirect_url=/credits');
  }

  api.user.payments.list.prefetchInfinite({
    cursor: 0,
  });

  api.user.balance.get.prefetch();

  return (
    <HydrateClient>
      <Heading
        title="Credits"
        description="These credits can be used to make LLM requests on any Echo app."
      />
      <Body>
        <Balance />
        <Payments />
      </Body>
    </HydrateClient>
  );
}
