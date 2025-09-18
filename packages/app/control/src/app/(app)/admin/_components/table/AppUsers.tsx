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
import { api } from '@/trpc/client';
import { UserLink } from '@/app/(app)/admin/_components';

// Define AppUser type based on the service function
export interface AppUser {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  totalPaid: number;
  membership: {
    role: string;
    status: string;
    totalSpent: number;
    createdAt: Date;
  };
  totalTransactions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalSpent: number;
  totalAppProfit: number;
  totalMarkupProfit: number;
  totalReferralProfit: number;
  lastTransactionAt: Date | null;
}

// Define columns for the app users table
const columns: TypedColumnDef<AppUser, string | number | boolean | Date>[] = [
  {
    accessorKey: 'name',
    header: 'User Name',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ getValue, row }) => {
      const name = getValue() as string | null;
      const email = row.original.email;
      const userId = row.original.id;
      return (
        <UserLink
          userId={userId}
          name={name}
          email={email}
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
        />
      );
    },
  },
  {
    accessorKey: 'membership.role',
    header: 'Role',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ row }) => {
      const role = row.original.membership.role;
      const roleColors = {
        owner: 'bg-purple-100 text-purple-800',
        member: 'bg-blue-100 text-blue-800',
        admin: 'bg-red-100 text-red-800',
      };
      const colorClass =
        roleColors[role as keyof typeof roleColors] ||
        'bg-gray-100 text-gray-800';

      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}
        >
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: 'membership.status',
    header: 'Status',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ row }) => {
      const status = row.original.membership.status;
      const statusColors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800',
      };
      const colorClass =
        statusColors[status as keyof typeof statusColors] ||
        'bg-gray-100 text-gray-800';

      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}
        >
          {status}
        </span>
      );
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
    accessorKey: 'totalInputTokens',
    header: 'Input Tokens',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const tokens = toNumber(getValue());
      return <IntCell value={tokens} />;
    },
  },
  {
    accessorKey: 'totalOutputTokens',
    header: 'Output Tokens',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue }) => {
      const tokens = toNumber(getValue());
      return <IntCell value={tokens} />;
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
    accessorKey: 'membership.createdAt',
    header: 'Joined App',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'date',
    cell: ({ row }) => {
      const date = row.original.membership.createdAt;
      return <DateCell date={date} />;
    },
  },
];

interface AppUsersTableProps {
  appId: string;
}

export default function AppUsersTable({ appId }: AppUsersTableProps) {
  return (
    <StatefulDataTable
      columns={columns}
      trpcQuery={params =>
        api.admin.app.getAppUsersWithPagination.useQuery({
          ...params,
          appId,
        })
      }
      showControls={true}
      getRowId={row => row.id}
      enableRowSelection={false}
    />
  );
}
