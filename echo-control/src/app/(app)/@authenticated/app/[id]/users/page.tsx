import { Suspense } from 'react';

import { User } from 'lucide-react';

import { ErrorBoundary } from 'react-error-boundary';

import { TableHeader, TableRow, Table, TableHead } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

import { Body, Heading } from '../../../_components/layout/page-utils';

import { LoadingUserRows, UserRows } from './_components/users';

import { api, HydrateClient } from '@/trpc/server';

export default async function UsersPage({
  params,
}: PageProps<'/app/[id]/users'>) {
  const { id } = await params;

  api.apps.app.users.list.prefetchInfinite({ appId: id });

  return (
    <HydrateClient>
      <Heading title="Users" />
      <Body className="gap-0">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent text-xs">
                <TableHead className="pl-4 flex items-center gap-2">
                  <div className="size-6 flex items-center justify-center bg-muted rounded-md">
                    <User className="size-4" />
                  </div>
                  Name
                </TableHead>
                <TableHead className="text-center">Transactions</TableHead>
                <TableHead className="text-center">Cost</TableHead>
                <TableHead className="text-right pr-4">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <ErrorBoundary fallback={null}>
              <Suspense fallback={<LoadingUserRows />}>
                <UserRows appId={id} />
              </Suspense>
            </ErrorBoundary>
          </Table>
        </Card>
      </Body>
    </HydrateClient>
  );
}
