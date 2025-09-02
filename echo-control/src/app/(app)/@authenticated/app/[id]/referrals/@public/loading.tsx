import { Body, Heading } from '../../../../_components/layout/page-utils';

import { LoadingReferralBonus } from '../_components/referral-amount';
import { LoadingReferrals } from '../_components/referrals';

export default async function LoadingAppReferralsPage() {
  return (
    <div>
      <Heading
        title="Referrals"
        description="Earn a percentage of this app's revenue by referring users to it."
      />
      <Body>
        <LoadingReferralBonus
          title="Referral Bonus"
          description="This is the % of revenue that will be allocated to you when you refer new users to this app."
        />
        <LoadingReferrals
          title="Referrals"
          description="You referred these users to this app."
        />
      </Body>
    </div>
  );
}
