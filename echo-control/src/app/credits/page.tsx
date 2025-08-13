import { Suspense } from 'react';

import { api, HydrateClient } from '@/trpc/server';

import { Payments } from './_components/payments';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ErrorBoundary } from 'react-error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddCredits } from './_components/add-credits';

export default async function CreditsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login?redirect_url=/credits');
  }

  await api.user.payments.list.prefetchInfinite({
    cursor: 0,
  });

  return (
    <HydrateClient>
      <div className="max-w-2xl mx-auto px-2 py-16 flex flex-col gap-8">
        <h1 className="text-4xl font-bold">Credits</h1>
        <Separator />
        <Card className="border rounded-lg overflow-hidden flex items-center justify-between p-4">
          <h2 className="flex items-center gap-4 text-3xl font-bold">
            <span className="text-muted-foreground">$</span>
            <Suspense fallback={<Skeleton className="w-16 h-9" />}>
              <Balance />
            </Suspense>
          </h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="turbo">
                <Plus className="size-4" />
                Add Credits
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
      </div>
    </HydrateClient>
  );
}

const Balance = async () => {
  const balance = await api.user.balance.get().catch(() => ({ balance: 0 }));
  return <span>{Number(balance.balance).toFixed(2)}</span>;
};
