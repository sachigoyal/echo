import { Body, Heading } from '../../../../_components/layout/page-utils';
import { getIsOwner } from '../../_lib/fetch';

import { ReferralBonus } from '../_components/referral-amount';
import { Referrals } from '../_components/referrals';
import { UpdateReferralBonusDialog } from '../_components/update-dialog';

export default async function AppReferralsOwnerPage({
  params,
}: PageProps<'/app/[id]/referrals'>) {
  const { id } = await params;

  const isOwner = await getIsOwner(id);

  if (!isOwner) {
    return null;
  }

  return (
    <div>
      <Heading
        title="Referrals"
        description="Incentivize users to share your app by allocating a percentage of the revenue to them."
      />
      <Body>
        <ReferralBonus
          appId={id}
          title="Referral Bonus"
          description="This is the % of revenue that will be allocated to users who refer new users."
        >
          <UpdateReferralBonusDialog appId={id} />
        </ReferralBonus>
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
