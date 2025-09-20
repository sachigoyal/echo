'use client';

import React from 'react';
import {
  StatefulDataTable,
  DateCell,
  MoneyCell,
  toNumber,
} from '@/components/server-side-data-table';
import type { TypedColumnDef } from '@/components/server-side-data-table/BaseTable';
import type { TableState } from '@/components/server-side-data-table/ActionControls';
import { api } from '@/trpc/client';
import { UserLink } from '@/app/(app)/admin/_components';
import type { RouterOutputs } from '@/trpc/client';

// Define columns for the user spending table
const columns: TypedColumnDef<
  RouterOutputs['admin']['spending']['getUserSpendingWithPagination']['items'][number],
  string | number | boolean | Date
>[] = [
  {
    accessorKey: 'name',
    header: 'User',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ getValue, row }) => {
      const name = getValue() as string | null;
      const email = row.original.email;
      const userId = row.original.id;
      return <UserLink userId={userId} name={name} email={email} />;
    },
  },
  {
    accessorKey: 'totalSpent',
    header: 'Total Spent',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'balance',
    header: 'Current Balance',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalPaid',
    header: 'Total Paid',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={2} />;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'date',
    cell: ({ getValue }) => {
      const date = getValue() as Date;
      return <DateCell date={date} />;
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'date',
    cell: ({ getValue }) => {
      const date = getValue() as Date;
      return <DateCell date={date} />;
    },
  },
];

export default function UserSpendingTable() {
  return (
    <StatefulDataTable
      columns={columns}
      trpcQuery={api.admin.spending.getUserSpendingWithPagination.useQuery}
      showControls={true}
      getRowId={row => row.id}
      actions={[
        {
          id: 'view-details',
          label: 'View Details',
          action: (tableState: TableState) => {
            console.log('View user spending details', tableState);
          },
        },
      ]}
      enableRowSelection={true}
    />
  );
}
