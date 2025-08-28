import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { PaymentsCard } from '@/app/(app)/@authenticated/_components/payments/card';

import { ReferralsTable, LoadingReferralsTable } from './table';

interface Props {
  appId: string;
}

const ReferralsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>Referrals</CardTitle>
        <CardDescription>
          These users were referred to your app by other users.
        </CardDescription>
      </CardHeader>
      {children}
    </Card>
  );
};

export const Referrals: React.FC<Props> = ({ appId }) => {
  return (
    <ReferralsContainer>
      <Suspense fallback={<LoadingReferralsTable />}>
        <ReferralsTable appId={appId} />
      </Suspense>
    </ReferralsContainer>
  );
};

export const LoadingReferrals = () => {
  return (
    <ReferralsContainer>
      <LoadingReferralsTable />
    </ReferralsContainer>
  );
};
