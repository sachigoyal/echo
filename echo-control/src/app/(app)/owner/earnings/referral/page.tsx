import { api, HydrateClient } from '@/trpc/server';

import { UserPayoutRecipient } from './_components/recipient';
import { PendingPayouts } from './_components/pending-payouts';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { unauthorized } from 'next/navigation';
import { ClaimablePayouts } from './_components/claimable-payouts';
import { Body, Heading } from '@/app/(app)/_components/layout/page-utils';

export default async function ReferralEarningsPage(
  props: PageProps<'/owner/earnings/referral'>
) {
  const user = await userOrRedirect('/owner/earnings/referral', props);

  if (!user) {
    return unauthorized();
  }

  api.user.payout.referral.get.prefetch();
  api.user.payout.referral.pending.prefetch();
  api.user.githubLink.get.prefetch();

  return (
    <HydrateClient>
      <Heading
        title="Referral Rewards"
        description="View and claim your referral rewards across all apps."
      />
      <Body>
        <UserPayoutRecipient />

        <ClaimablePayouts />

        <PendingPayouts />
      </Body>
    </HydrateClient>
  );
}
