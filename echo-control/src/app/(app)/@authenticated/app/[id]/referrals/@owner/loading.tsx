import { Body, Heading } from '../../../../_components/layout/page-utils';

import { LoadingReferralBonus } from '../_components/referral-amount';
import { LoadingReferrals } from '../_components/referrals';

export default async function LoadingAppReferralsPage() {
  return (
    <div>
      <Heading
        title="Referrals"
        description="Incentivize users to share your app by allocating a percentage of the revenue to them."
      />
      <Body>
        <LoadingReferralBonus
          title="Referral Bonus"
          description="This is the % of revenue that will be allocated to users who refer new users."
        />
        <LoadingReferrals
          title="Referrals"
          description="These users were referred to your app by other users."
        />
      </Body>
    </div>
  );
}
