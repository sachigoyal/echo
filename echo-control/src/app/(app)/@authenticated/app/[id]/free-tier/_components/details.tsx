'use client';

import React from 'react';

import { formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { SpendLimit } from './spend-limit';

interface Props {
  appId: string;
}

export const Details: React.FC<Props> = ({ appId }) => {
  const [freeTier] = api.apps.app.freeTier.get.useSuspenseQuery({
    appId,
  });

  return (
    <DetailsContent
      items={[
        {
          label: 'User Spend Limit',
          value: (
            <SpendLimit
              appId={appId}
              spendLimit={freeTier?.perUserSpendLimit}
            />
          ),
        },
        {
          label: 'Total Purchased',
          value: (
            <h3 className="text-2xl font-bold text-foreground/80">
              {formatCurrency(freeTier?.totalPaid ?? 0)}
            </h3>
          ),
        },
        {
          label: 'Total Spent',
          value: (
            <h3 className="text-2xl font-bold text-foreground/80">
              {formatCurrency(freeTier?.totalSpent ?? 0)}
            </h3>
          ),
        },
      ]}
    />
  );
};

export const LoadingFreeTierDetails = () => {
  return (
    <DetailsContent
      items={[
        { label: 'User Spend Limit', value: <Skeleton className="w-24 h-6" /> },
        { label: 'Total Purchased', value: <Skeleton className="w-24 h-6" /> },
        { label: 'Total Spent', value: <Skeleton className="w-24 h-6" /> },
      ]}
    />
  );
};

interface DetailsProps {
  items: {
    label: string;
    value: React.ReactNode;
  }[];
}

const DetailsContent: React.FC<DetailsProps> = ({ items }) => {
  return (
    <div className="flex w-full gap-2">
      {items.map(item => (
        <FreeTierCell key={item.label} {...item} />
      ))}
    </div>
  );
};

const FreeTierCell = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <Card className="flex flex-col gap-1 w-full p-4">
      <h2 className="text-xs font-medium text-muted-foreground/60">{label}</h2>
      {value}
    </Card>
  );
};
