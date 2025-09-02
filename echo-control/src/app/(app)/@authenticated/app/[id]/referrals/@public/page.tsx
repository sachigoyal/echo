import { auth } from '@/auth';
import { Body, Heading } from '../../../../_components/layout/page-utils';

import { ReferralBonus } from '../_components/referral-amount';
import { Referrals } from '../_components/referrals';
import { unauthorized } from 'next/navigation';
import { getIsOwner } from '../../_lib/fetch';

export default async function AppReferralsOwnerPage({
  params,
}: PageProps<'/app/[id]/referrals'>) {
  const { id } = await params;

  const isOwner = await getIsOwner(id);

  if (isOwner) {
    return null;
  }

  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  return (
    <div>
      <Heading
        title="Referrals"
        description="Earn a percentage of this app's revenue by referring users to it."
      />
      <Body>
        <ReferralBonus
          appId={id}
          title="Referral Bonus"
          description="This is the % of revenue that will be allocated to you when you refer new users to this app."
        />
        <Referrals
          appId={id}
          referrerUserId={session.user.id}
          title="Referrals"
          description="You referred these users to this app."
        />
      </Body>
    </div>
  );
}
