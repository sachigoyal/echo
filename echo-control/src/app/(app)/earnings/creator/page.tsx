import { api, HydrateClient } from '@/trpc/server';

import { ClaimablePayouts } from './_components/claimable-payouts';
import { PendingPayouts } from './_components/pending-payouts';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { unauthorized } from 'next/navigation';
import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';

export default async function MarkupEarningsPage(
  props: PageProps<'/owner/earnings/markup'>
) {
  const user = await userOrRedirect('/owner/earnings/markup', props);

  if (!user) {
    return unauthorized();
  }

  api.user.payout.markup.get.prefetch();
  api.user.payout.markup.pending.prefetch();

  return (
    <HydrateClient>
      <Heading
        title="Markup Earnings"
        description="View and claim your app markup earnings."
      />
      <Body>
        <ClaimablePayouts />

        <PendingPayouts />
      </Body>
    </HydrateClient>
  );
}
