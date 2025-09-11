import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { Suspense } from 'react';

import { Balance } from './balance-display';
import { HydrateClient } from '@/trpc/server';
import { auth } from '@/auth';

export const BalanceButton = async () => {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return (
    <HydrateClient>
      <Link href="/credits">
        <Button variant="outline" asChild>
          <Suspense fallback={<Skeleton className="h-5 w-10" />}>
            <Balance />
          </Suspense>
        </Button>
      </Link>
    </HydrateClient>
  );
};
