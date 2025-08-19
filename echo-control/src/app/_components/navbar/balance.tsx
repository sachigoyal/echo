import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton';

import { Suspense } from 'react';

import { Balance } from './balance-display';
import { api } from '@/trpc/server';

export const BalanceButton = async () => {
  void api.user.balance.get.prefetch();

  return (
    <Link href="/credits">
      <Button variant="outline">
        <Logo className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <Suspense fallback={<Skeleton className="h-5 w-10" />}>
          <Balance />
        </Suspense>
      </Button>
    </Link>
  );
};
