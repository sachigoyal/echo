import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { Suspense } from 'react';

import { Balance } from './balance-display';
import { api, HydrateClient } from '@/trpc/server';

export const BalanceButton = async () => {
  void api.user.balance.get.prefetch();

  return (
    <HydrateClient>
      <Button variant="outline" asChild>
        <Link href="/credits">
          <Suspense fallback={<Skeleton className="h-5 w-10" />}>
            <Balance />
          </Suspense>
        </Link>
      </Button>
    </HydrateClient>
  );
};
