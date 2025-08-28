import { Body, Heading } from '../../../_components/layout/page-utils';

import { LoadingReferralBonus } from './_components/referral-amount';

export default async function LoadingAppReferralsPage() {
  return (
    <div>
      <Heading
        title="Referrals"
        description="Incentivize users to share your app by allocating a percentage of the revenue to them."
      />
      <Body>
        <LoadingReferralBonus />
      </Body>
    </div>
  );
}
