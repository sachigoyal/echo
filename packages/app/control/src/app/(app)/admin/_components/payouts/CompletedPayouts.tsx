'use client';

import { useState } from 'react';
import { api } from '@/trpc/client';
import {
  CollapsibleTable,
  type CollapsibleTableColumn,
} from '@/components/collapsible-table/CollapsibleTable';

type Props = {
  pageSize?: number;
};

export function CompletedPayoutsTable({ pageSize = 10 }: Props) {
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, refetch } =
    api.admin.payouts.list.completed.useQuery({
      cursor: page,
      page_size: pageSize,
    });

  type Row = NonNullable<typeof data>['items'][number];
  type InnerRow = Row['payouts'][number];

  const columns: CollapsibleTableColumn<Row>[] = [
    {
      id: 'user',
      header: 'User',
      cell: row => (
        <div className="flex flex-col">
          <span>{row.user.name || '—'}</span>
          <span className="text-muted-foreground">{row.user.email}</span>
        </div>
      ),
    },
    {
      id: 'total',
      header: 'Total Completed',
      className: 'text-right',
      cell: row => <span>${row.totalOutstanding.toFixed(2)}</span>,
    },
  ];

  const innerColumns: CollapsibleTableColumn<InnerRow>[] = [
    {
      id: 'payout-id',
      header: 'Payout ID',
      cell: r => <span className="font-mono text-xs">{r.id}</span>,
    },
    {
      id: 'echo-app',
      header: 'Echo App',
      cell: r => <span className="font-mono text-xs">{r.echoApp.name}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      className: 'text-right',
      cell: r => <span>${r.amount.toFixed(2)}</span>,
    },
    {
      id: 'github-type',
      header: 'GitHub Type',
      cell: r => (
        <span className="capitalize">
          {r.recipientGithubLink.githubType.toLowerCase()}
        </span>
      ),
    },
    {
      id: 'github-id',
      header: 'GitHub ID',
      cell: r => (
        <span className="font-mono text-xs">
          {r.recipientGithubLink.githubId}
        </span>
      ),
    },
    {
      id: 'github-url',
      header: 'GitHub URL',
      cell: r =>
        r.recipientGithubLink.githubUrl ? (
          <a
            href={r.recipientGithubLink.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Link
          </a>
        ) : (
          <span>—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Completed Payouts</h2>
        <div className="flex items-center gap-3">
          {isFetching && (
            <span className="text-sm text-muted-foreground">Refreshing…</span>
          )}
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Refresh
          </button>
        </div>
      </div>

      <CollapsibleTable<Row, InnerRow>
        title="Completed Payouts by User"
        columns={columns}
        items={(data?.items ?? []).map(group => ({
          id: group.user.id,
          row: group,
          innerTable: { columns: innerColumns, rows: group.payouts },
        }))}
        getRowId={row => row.user.id}
        emptyState={isLoading ? 'Loading…' : 'No completed payouts.'}
      />

      <div className="flex items-center justify-between">
        <button
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <div className="text-sm">
          Page {page + 1}
          {data?.has_next ? ' (more available)' : ''}
        </div>
        <button
          className="px-3 py-2 border rounded disabled:opacity-50"
          onClick={() => setPage(p => (data?.has_next ? p + 1 : p))}
          disabled={!data?.has_next}
        >
          Next
        </button>
      </div>
    </div>
  );
}
