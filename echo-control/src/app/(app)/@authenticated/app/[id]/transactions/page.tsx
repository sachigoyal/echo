import { Suspense } from 'react';

import { Card } from '@/components/ui/card';

import { Body, Heading } from '../../../_components/layout/page-utils';

import {
  LoadingTransactionsTable,
  TransactionsTable,
} from './_components/transactions';

import { api, HydrateClient } from '@/trpc/server';

export default async function TransactionsPage({
  params,
}: PageProps<'/app/[id]/transactions'>) {
  const { id } = await params;

  api.apps.app.transactions.list.prefetchInfinite({
    appId: id,
    page_size: 200,
  });

  return (
    <HydrateClient>
      <Heading title="Transactions" />
      <Body className="gap-0">
        <Card className="overflow-hidden">
          <Suspense fallback={<LoadingTransactionsTable />}>
            <TransactionsTable appId={id} />
          </Suspense>
        </Card>
      </Body>
    </HydrateClient>
  );
}
