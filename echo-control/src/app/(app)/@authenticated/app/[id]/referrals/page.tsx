import { Body, Heading } from '../../../_components/layout/page-utils';

import { ReferralBonus } from './_components/referral-amount';
import { Referrals } from './_components/referrals';

export default async function AppReferralsPage({
  params,
}: PageProps<'/app/[id]/referrals'>) {
  const { id } = await params;

  return (
    <div>
      <Heading
        title="Referrals"
        description="Incentivize users to share your app by allocating a percentage of the revenue to them."
      />
      <Body>
        <ReferralBonus appId={id} />
        <Referrals
          appId={id}
          referrerUserId="any"
          title="Referrals"
          description="These users were referred to your app by other users."
        />
      </Body>
    </div>
  );
}
