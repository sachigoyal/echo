'use client';

import { api } from '@/trpc/client';
import { formatCurrency } from '@/lib/utils';

interface Props {
  appId: string;
}

export const Balance = ({ appId }: Props) => {
  const [freeTier] = api.apps.app.freeTier.get.useSuspenseQuery({
    appId,
  });

  return (
    <span>
      {freeTier ? (
        <span>{formatCurrency(freeTier.balance)}</span>
      ) : (
        <span>{formatCurrency(0)}</span>
      )}
    </span>
  );
};
