'use client';

import React from 'react';
import {
  StatefulDataTable,
  DateCell,
  MoneyCell,
} from '@/components/server-side-data-table';
import {
  TableState,
  TypedColumnDef,
} from '@/components/server-side-data-table/BaseTable';
import { api } from '@/trpc/client';
import { UserLink } from '@/app/(app)/admin/_components';

// Define UserSpending type based on the service function
export interface UserSpending {
  id: string;
  name: string | null;
  email: string;
  totalSpent: number;
  balance: number;
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to safely convert values to numbers
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'bigint') return Number(value);
  return 0;
};

// Define columns for the user spending table
const columns: TypedColumnDef<
  UserSpending,
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
    <div className="container mx-auto py-6 px-4">
      <div className="p-6">
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
      </div>
    </div>
  );
}
