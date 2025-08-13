import React, { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

import { api } from '@/trpc/server';

import { formatCurrency } from '@/lib/balance';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export const BalanceButton = () => {
  return (
    <Link href="/credits">
      <Button variant="outline">
        <Logo className="size-4" />
        <Suspense fallback={<Skeleton className="h-5 w-10" />}>
          <Balance />
        </Suspense>
      </Button>
    </Link>
  );
};

export const Balance = async () => {
  const balance = await api.user.balance.get();

  return (
    <span className="text-sm font-extrabold text-foreground">
      {formatCurrency(Number(balance?.balance) || 0)}
    </span>
  );
};
