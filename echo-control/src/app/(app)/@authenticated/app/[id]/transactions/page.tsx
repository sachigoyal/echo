import { Suspense } from 'react';

import { Activity } from 'lucide-react';

import { ErrorBoundary } from 'react-error-boundary';

import { TableHeader, TableRow, Table, TableHead } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

import { Body, Heading } from '../../../_components/layout/page-utils';

import {
  LoadingTransactionRows,
  TransactionRows,
} from './_components/transactions';

import { api, HydrateClient } from '@/trpc/server';

export default async function UsersPage({
  params,
}: PageProps<'/app/[id]/users'>) {
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-xs">
                <TableHead className="pl-4 flex items-center gap-2 my-2">
                  <div className="size-8 flex items-center justify-center bg-muted rounded-md">
                    <Activity className="size-4" />
                  </div>
                  Activity
                </TableHead>
                <TableHead className="text-right pr-4">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <ErrorBoundary fallback={null}>
              <Suspense fallback={<LoadingTransactionRows />}>
                <TransactionRows appId={id} />
              </Suspense>
            </ErrorBoundary>
          </Table>
        </Card>
      </Body>
    </HydrateClient>
  );
}
