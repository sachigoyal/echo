import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { ErrorBoundary } from 'react-error-boundary';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Heading, Body } from '../../_components/layout/page-utils';

import { auth } from '@/auth';

import { api, HydrateClient } from '@/trpc/server';

import { Keys } from './_components/keys';

export default async function CreditsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login?redirect_url=/keys');
  }

  api.user.apiKeys.list.prefetchInfinite({
    cursor: 0,
  });

  return (
    <HydrateClient>
      <Heading title="API Keys" />
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
