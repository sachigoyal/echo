'use client';

import React from 'react';
import {
  StatefulDataTable,
  DateCell,
  MoneyCell,
  IntCell,
} from '@/components/server-side-data-table';
import { TypedColumnDef } from '@/components/server-side-data-table/BaseTable';
import { api } from '@/trpc/client';
import { AppLink } from '@/app/(app)/admin/_components';

// Define UserApp type based on the service function
export interface UserApp {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Spending information
  totalSpentAcrossApps: number;
  totalSpentFreeTier: number;
  totalSpentUserBalances: number;
  totalSpent: number;
  // Earnings information
  totalReferralProfitEarned: number;
  totalReferralProfitClaimed: number;
  totalMarkupProfitEarned: number;
  totalMarkupProfitClaimed: number;
  totalTransactionCosts: number;
  // Usage statistics
  totalUsers: number;
  totalTransactions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  // Popular models
  mostPopularModels: Array<{
    model: string;
    provider: string;
    transactionCount: number;
    totalTokens: number;
  }>;
  lastTransactionAt: Date | null;
}

// Helper function to safely convert values to numbers
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'bigint') return Number(value);
  return 0;
};

// Define columns for the user apps table
const columns: TypedColumnDef<UserApp, string | number | boolean | Date>[] = [
  {
    accessorKey: 'name',
    header: 'App Name',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ getValue, row }) => {
      const name = getValue() as string;
      const description = row.original.description;
      const appId = row.original.id;
      return (
        <AppLink
          appId={appId}
          name={name}
          description={description}
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
    accessorKey: 'mostPopularModels',
    header: 'Popular Models',
    enableSorting: false,
    enableColumnFilter: false,
    columnType: 'string',
    cell: ({ row }) => {
      const models = row.original.mostPopularModels;
      if (models.length === 0) {
        return <span className="text-gray-400 italic">No models</span>;
      }
      return (
        <div className="flex flex-col space-y-1">
          {models.slice(0, 3).map((model, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                {model.provider}/{model.model}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {model.transactionCount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
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
    <div className="container mx-auto py-6 px-4">
      <div className="p-6">
        <StatefulDataTable
          columns={columns}
          trpcQuery={params =>
            api.admin.earnings.getUserAppsWithPagination.useQuery({
              ...params,
              userId,
            })
          }
          showControls={true}
          getRowId={row => row.id}
          enableRowSelection={false}
        />
      </div>
    </div>
  );
}
