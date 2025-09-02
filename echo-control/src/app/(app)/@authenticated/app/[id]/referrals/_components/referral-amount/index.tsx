import { Suspense } from 'react';

import { Card } from '@/components/ui/card';

import { ReferralBonusAmount, ReferralBonusAmountSkeleton } from './amount';

import { api, HydrateClient } from '@/trpc/server';

interface Props {
  appId: string;
}

const ReferralBonusContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Card className="border rounded-lg overflow-hidden flex flex-col gap-2 p-4">
      <h1 className="text-lg font-semibold text-muted-foreground">
        Referral Bonus
      </h1>
      <div className="w-full">{children}</div>
      <p className="text-sm text-muted-foreground">
        This is the % of revenue that will be allocated to users who refer new
        users.
      </p>
    </Card>
  );
};

export const ReferralBonus: React.FC<Props> = ({ appId }) => {
  api.apps.app.referralReward.get.prefetch(appId);

  return (
    <HydrateClient>
      <ReferralBonusContainer>
        <Suspense fallback={<ReferralBonusAmountSkeleton />}>
          <ReferralBonusAmount appId={appId} />
        </Suspense>
      </ReferralBonusContainer>
    </HydrateClient>
  );
};

export const LoadingReferralBonus = () => {
  return (
    <ReferralBonusContainer>
      <ReferralBonusAmountSkeleton />
    </ReferralBonusContainer>
  );
};
