import { Suspense } from 'react';

import { Card } from '@/components/ui/card';

import { Body, Heading } from '../../../_components/layout/page-utils';

import {
  LoadingTransactionsTable,
  TransactionsTable,
} from './_components/transactions';

import { api, HydrateClient } from '@/trpc/server';

import type { Metadata } from 'next';
import { userOrRedirect } from '@/auth/user-or-redirect';
import { getApp } from '../_lib/fetch';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: {
    default: 'Transactions',
    template: 'Transactions | %s',
  },
};

export default async function TransactionsPage(
  props: PageProps<'/app/[id]/transactions'>
) {
  const { id } = await props.params;

  try {
    await getApp(id);
  } catch (error) {
    return notFound();
  }

  await userOrRedirect(`/app/${id}/transactions`, props);

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
