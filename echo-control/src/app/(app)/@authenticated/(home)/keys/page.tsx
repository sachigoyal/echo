import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { Heading, Body } from '../../_components/layout/page-utils';

import { auth } from '@/auth';

import { api, HydrateClient } from '@/trpc/server';

import { Keys } from './_components/keys';

import { GenerateKeyWithSelect } from './_components/generate-key';

export default async function KeysPage() {
  const session = await auth();

  if (!session) {
    redirect('/login?redirect_url=/keys');
  }

  api.user.apiKeys.list.prefetchInfinite({});
  api.apps.list.member.prefetchInfinite({});

  return (
    <HydrateClient>
      <Heading
        title="API Keys"
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="turbo">Generate Key</Button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden">
              <DialogHeader className="p-4 pb-0">
                <DialogTitle>Generate API Key</DialogTitle>
                <DialogDescription>
                  API Keys are scoped to a specific app and can only be used to
                  authenticate with that app.
                </DialogDescription>
              </DialogHeader>
              <div className="w-full max-w-full overflow-hidden p-4 pt-0">
                <GenerateKeyWithSelect />
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <Body>
        <Card className="bg-muted/50">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg font-semibold">API Keys</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ErrorBoundary fallback={<div>Error loading keys</div>}>
              <Suspense fallback={<div>Loading keys...</div>}>
                <Keys />
              </Suspense>
            </ErrorBoundary>
          </CardContent>
        </Card>
      </Body>
    </HydrateClient>
  );
}
