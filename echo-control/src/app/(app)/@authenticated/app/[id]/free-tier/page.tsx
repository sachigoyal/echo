import { Suspense } from 'react';

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

import { Body, Heading } from '../../../_components/layout/page-utils';

import { api } from '@/trpc/server';
import { Balance } from './_components/balance';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { Payments } from './_components/payments';
import { Details, LoadingFreeTierDetails } from './_components/details';

export default async function FreeTierPage({
  params,
}: PageProps<'/app/[id]/free-tier'>) {
  const { id } = await params;

  api.apps.app.freeTier.payments.list.prefetchInfinite({
    cursor: 0,
    appId: id,
  });

  api.apps.app.freeTier.get.prefetch({
    appId: id,
  });

  return (
    <div>
      <Heading
        title="Free Tier"
        description="Allow your users to test out your app for free before they have to buy credits and spend their echo balance."
      />
      <Body>
        <div className="flex flex-col gap-2">
          <Card className="border rounded-lg overflow-hidden flex flex-col gap-2 p-4">
            <h1 className="text-lg font-semibold text-muted-foreground">
              Balance
            </h1>
            <div className="flex items-center gap-4 w-full">
              <h2 className="flex items-center gap-4 text-3xl font-bold">
                <Suspense fallback={<Skeleton className="w-16 h-9" />}>
                  <Balance appId={id} />
                </Suspense>
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="turbo" size="sm">
                    <Plus className="size-3.5" />
                    Add Credits
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Free Tier Credits</DialogTitle>
                    <DialogDescription>
                      Your users will be able to use free tier credits before
                      they have to buy credits and spend their Echo balance.
                    </DialogDescription>
                  </DialogHeader>
                  {/* <AddCredits /> */}
                </DialogContent>
              </Dialog>
            </div>
          </Card>
          <Suspense fallback={<LoadingFreeTierDetails />}>
            <Details appId={id} />
          </Suspense>
        </div>

        <Card className="bg-transparent">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg font-semibold">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ErrorBoundary fallback={<div>Error loading payments</div>}>
              <Suspense fallback={<div>Loading...</div>}>
                <Payments appId={id} />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </Body>
    </div>
  );
}
