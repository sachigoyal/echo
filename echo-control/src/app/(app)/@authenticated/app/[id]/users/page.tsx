import { Suspense } from 'react';

import { Card } from '@/components/ui/card';

import { Body, Heading } from '../../../_components/layout/page-utils';

import { UsersTable, LoadingUsersTable } from './_components/users';

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
          <Suspense fallback={<LoadingUsersTable />}>
            <UsersTable appId={id} />
          </Suspense>
        </Card>
      </Body>
    </HydrateClient>
  );
}
