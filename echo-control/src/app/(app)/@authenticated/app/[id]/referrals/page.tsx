import { api, HydrateClient } from '@/trpc/server';
import { Body, Heading } from '../../../_components/layout/page-utils';
import { ReferralBonus } from './_components/referral-amount';

export default async function AppReferralsPage({
  params,
}: PageProps<'/app/[id]/referrals'>) {
  const { id } = await params;

  api.apps.app.referralReward.get.prefetch(id);

  return (
    <HydrateClient>
      <Heading
        title="Referrals"
        description="Incentivize users to share your app by allocating a percentage of the revenue to them."
      />
      <Body>
        <ReferralBonus appId={id} />
      </Body>
    </HydrateClient>
  );
}
