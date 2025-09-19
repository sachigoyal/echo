'use client';

import React from 'react';
import {
  StatefulDataTable,
  DateCell,
  MoneyCell,
  IntCell,
  toNumber,
} from '@/components/server-side-data-table';
import { TypedColumnDef } from '@/components/server-side-data-table/BaseTable';
import { TableState } from '@/components/server-side-data-table/ActionControls';
import { api } from '@/trpc/client';
import { UserLink } from '@/app/(app)/admin/_components';
import { RouterOutputs } from '@/trpc/client';

// Define columns for the user earnings table
const columns: TypedColumnDef<
  RouterOutputs['admin']['earnings']['getUserEarningsWithPagination']['items'][number],
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
    accessorKey: 'totalRevenue',
    header: 'Total Revenue',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalAppProfit',
    header: 'App Profit',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalMarkupProfit',
    header: 'Markup Profit',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalReferralProfit',
    header: 'Referral Profit',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'transactionCount',
    header: 'Transactions',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const count = toNumber(getValue());
      return <IntCell value={count} />;
    },
  },
  {
    accessorKey: 'referralCodesGenerated',
    header: 'Referral Codes',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const count = toNumber(getValue());
      return <IntCell value={count} />;
    },
  },
  {
    accessorKey: 'referredUsersCount',
    header: 'Referred Users',
    enableSorting: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const count = toNumber(getValue());
      return <IntCell value={count} />;
    },
  },
  {
    accessorKey: 'totalCompletedPayouts',
    header: 'Payouts',
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

export default function UserEarningsTable() {
  return (
    <StatefulDataTable
      columns={columns}
      trpcQuery={api.admin.earnings.getUserEarningsWithPagination.useQuery}
      showControls={true}
      getRowId={row => row.id}
      actions={[
        {
          id: 'view-details',
          label: 'View Details',
          action: (tableState: TableState) => {
            console.log('View user details', tableState);
          },
        },
      ]}
      enableRowSelection={true}
    />
  );
}
