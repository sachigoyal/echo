'use client';

import { api } from '@/trpc/client';

export const Balance = () => {
  const [balance] = api.user.balance.get.useSuspenseQuery();
  return <span>{Number(balance.balance).toFixed(2)}</span>;
};
