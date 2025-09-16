'use client';

import React from 'react';
import {
  StatefulDataTable,
  DateCell,
  MoneyCell,
  StringCell,
  toNumber,
} from '@/components/server-side-data-table';
import { TypedColumnDef } from '@/components/server-side-data-table/BaseTable';
import { api } from '@/trpc/client';
import { UserLink } from '@/app/(app)/admin/_components';
import { EnumPaymentSource } from '@/generated/prisma';

// Define PaymentHistory type based on the service function
export interface PaymentHistory {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  source: EnumPaymentSource;
  description: string | null;
  isArchived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  spendPoolId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  spendPool: {
    id: string;
    name: string;
    description: string | null;
    echoApp: {
      id: string;
      name: string;
    };
  } | null;
}

// Helper function to format payment source
const formatPaymentSource = (source: EnumPaymentSource): string => {
  switch (source) {
    case 'stripe':
      return 'Stripe';
    case 'admin':
      return 'Admin';
    case 'signUpGift':
      return 'Sign-up Gift';
    default:
      return source;
  }
};

// Helper function to format payment status
const formatPaymentStatus = (
  status: string
): { label: string; className: string } => {
  switch (status.toLowerCase()) {
    case 'succeeded':
    case 'completed':
      return { label: 'Completed', className: 'bg-green-100 text-green-800' };
    case 'pending':
      return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
    case 'failed':
    case 'canceled':
      return { label: 'Failed', className: 'bg-red-100 text-red-800' };
    case 'processing':
      return { label: 'Processing', className: 'bg-blue-100 text-blue-800' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800' };
  }
};

// Define columns for the payment history table
const columns: TypedColumnDef<
  PaymentHistory,
  string | number | boolean | Date
>[] = [
  {
    accessorKey: 'paymentId',
    header: 'Payment ID',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    size: 200,
    cell: ({ getValue }) => {
      const paymentId = getValue() as string;
      return <StringCell value={paymentId} className="font-mono" />;
    },
  },
  {
    accessorKey: 'user.name',
    header: 'User',
    enableSorting: false,
    enableColumnFilter: false,
    columnType: 'string',
    cell: ({ row }) => {
      const user = row.original.user;
      return <UserLink userId={user.id} name={user.name} email={user.email} />;
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'number',
    cell: ({ getValue, row }) => {
      const amount = toNumber(getValue());
      const currency = row.original.currency.toUpperCase();
      const currencySymbol = currency === 'USD' ? '$' : `${currency} `;
      return (
        <MoneyCell amount={amount} decimals={4} currency={currencySymbol} />
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const { label, className } = formatPaymentStatus(status);
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}
        >
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: 'source',
    header: 'Source',
    enableSorting: true,
    enableColumnFilter: true,
    columnType: 'string',
    cell: ({ getValue }) => {
      const source = getValue() as EnumPaymentSource;
      const formatted = formatPaymentSource(source);
      return (
        <span className="font-mono text-sm px-2 py-1 rounded">{formatted}</span>
      );
    },
  },
  {
    accessorKey: 'spendPool',
    header: 'Spend Pool',
    enableSorting: false,
    enableColumnFilter: false,
    columnType: 'string',
    cell: ({ row }) => {
      const spendPool = row.original.spendPool;
      if (!spendPool) {
        return (
          <span className="text-gray-400 italic text-sm">Direct payment</span>
        );
      }
      return <StringCell value={spendPool.name} />;
    },
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    enableColumnFilter: true,
    columnType: 'string',
    size: 200,
    cell: ({ getValue }) => {
      const description = getValue() as string | null;
      return (
        <StringCell
          value={description}
          maxWidth="max-w-[180px]"
          emptyText="No description"
        />
      );
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

export default function PaymentHistoryTable() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="p-6">
        <StatefulDataTable
          columns={columns}
          trpcQuery={api.admin.payments.getPaymentsWithPagination.useQuery}
          showControls={true}
          getRowId={row => row.id}
          enableRowSelection={false}
        />
      </div>
    </div>
  );
}
