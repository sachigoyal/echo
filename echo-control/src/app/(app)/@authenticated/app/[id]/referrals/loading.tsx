import { Body, Heading } from '../../../_components/layout/page-utils';

import { LoadingReferralBonus } from './_components/referral-amount';

export default async function LoadingAppReferralsPage() {
  return (
    <div>
      <Heading title="Referrals" description="" />
      <Body>
        <LoadingReferralBonus title="Referral Bonus" description="" />
      </Body>
    </div>
  );
}
