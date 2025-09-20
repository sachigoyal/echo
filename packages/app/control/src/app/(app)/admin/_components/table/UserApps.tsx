'use client';

import React from 'react';
import {
  StatefulDataTable,
  DateCell,
  MoneyCell,
  IntCell,
  toNumber,
} from '@/components/server-side-data-table';
import type { TypedColumnDef } from '@/components/server-side-data-table/BaseTable';
import { api } from '@/trpc/client';
import { AppLink } from '@/app/(app)/admin/_components';
import type { RouterOutputs } from '@/trpc/client';

// Define columns for the user apps table
const columns: TypedColumnDef<
  RouterOutputs['admin']['user']['getUserAppsWithPagination']['items'][number],
  string | number | boolean | Date
>[] = [
  {
    accessorKey: 'name',
    header: 'App Name',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ getValue, row }) => {
      const name = getValue() as string;
      const appId = row.original.id;
      return (
        <AppLink
          appId={appId}
          name={name}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          maxWidth="max-w-xs"
        />
      );
    },
  },
  {
    accessorKey: 'totalUsers',
    header: 'Total Users',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const count = toNumber(getValue());
      return <IntCell value={count} />;
    },
  },
  {
    accessorKey: 'totalTransactions',
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
    accessorKey: 'totalTokens',
    header: 'Total Tokens',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const tokens = toNumber(getValue());
      return <IntCell value={tokens} />;
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
    accessorKey: 'totalSpentFreeTier',
    header: 'Free Tier Spent',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalSpentUserBalances',
    header: 'User Balance Spent',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalReferralProfitEarned',
    header: 'Referral Earned',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalReferralProfitClaimed',
    header: 'Referral Claimed',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalMarkupProfitEarned',
    header: 'Markup Earned',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalMarkupProfitClaimed',
    header: 'Markup Claimed',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'totalTransactionCosts',
    header: 'Transaction Costs',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const amount = toNumber(getValue());
      return <MoneyCell amount={amount} decimals={4} />;
    },
  },
  {
    accessorKey: 'lastTransactionAt',
    header: 'Last Transaction',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'date',
    cell: ({ getValue }) => {
      const date = getValue() as Date | null;
      return <DateCell date={date} emptyText="Never" />;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'date',
    cell: ({ getValue }) => {
      const date = getValue() as Date;
      return <DateCell date={date} />;
    },
  },
];

interface UserAppsTableProps {
  userId: string;
}

export default function UserAppsTable({ userId }: UserAppsTableProps) {
  return (
    <StatefulDataTable
      title="User Apps"
      columns={columns}
      trpcQuery={params =>
        api.admin.user.getUserAppsWithPagination.useQuery({
          ...params,
          userId,
        })
      }
      showControls={true}
      getRowId={row => row.id}
      enableRowSelection={false}
    />
  );
}
