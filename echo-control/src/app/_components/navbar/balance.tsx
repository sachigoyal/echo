'use client';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Balance = dynamic(
  () => import('./balance-display').then(mod => ({ default: mod.Balance })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-5 w-10" />,
  }
);

export const BalanceButton = () => {
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
