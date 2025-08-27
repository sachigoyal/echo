import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { ErrorBoundary } from 'react-error-boundary';

import { Gift, Plus } from 'lucide-react';

import { Payments } from './_components/payments';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { Heading, Body } from '../../_components/layout/page-utils';

import { AddCredits } from './_components/add-credits';
import { RedeemCredits } from './_components/redeem-credits';
import { Balance } from './_components/balance';

import { auth } from '@/auth';

import { api, HydrateClient } from '@/trpc/server';

export default async function CreditsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login?redirect_url=/credits');
  }

  api.user.payments.list.prefetchInfinite({
    cursor: 0,
  });

  api.user.balance.get.prefetch();

  return (
    <HydrateClient>
      <Heading title="Credits" />
      <Body>
        <Card className="border rounded-lg overflow-hidden flex items-center justify-between p-4">
          <h2 className="flex items-center gap-4 text-3xl font-bold">
            <span className="text-muted-foreground">$</span>
            <Suspense fallback={<Skeleton className="w-16 h-9" />}>
              <Balance />
            </Suspense>
          </h2>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="turbo">
                  <Plus className="size-4" />
                  Buy Credits
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Credits</DialogTitle>
                  <DialogDescription>
                    You can use Echo credits to use LLMs on any Echo app.
                  </DialogDescription>
                </DialogHeader>
                <AddCredits />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Gift className="size-4" />
                  Redeem Code
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Redeem Credit Code</DialogTitle>
                  <DialogDescription>
                    You can use Echo credits to use LLMs on any Echo app.
                  </DialogDescription>
                </DialogHeader>
                <RedeemCredits />
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg font-semibold">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ErrorBoundary fallback={<div>Error loading payments</div>}>
              <Suspense fallback={<div>Loading...</div>}>
                <Payments />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </Body>
    </HydrateClient>
  );
}
