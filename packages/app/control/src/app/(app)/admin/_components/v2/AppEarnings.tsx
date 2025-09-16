'use client';

import React from 'react';
import {
  StatefulDataTable,
  DateCell,
  EmailCell,
  MoneyCell,
  toNumber,
  IntCell,
} from '@/components/server-side-data-table';
import {
  TableState,
  TypedColumnDef,
} from '@/components/server-side-data-table/BaseTable';
import { api } from '@/trpc/client';
import { AppLink, UserLink } from '@/app/(app)/admin/_components';

// Define AppEarnings type based on the service function
export interface AppEarnings {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorUser: {
    id: string;
    name: string | null;
    email: string;
  };
  appEmailCampaigns: string[];
  ownerEmailCampaigns: string[];
  totalTransactions: number;
  totalRevenue: number;
  totalAppProfit: number;
  totalMarkupProfit: number;
  totalReferralProfit: number;
  totalReferralCodes: number;
  totalUsers: number;
}

// Define columns for the app earnings table
const columns: TypedColumnDef<AppEarnings, string | number | boolean | Date>[] =
  [
    {
      accessorKey: 'name',
      header: 'App Name',
      enableSorting: true,
      enableColumnFilter: true,
      columnType: 'string',
      cell: ({ getValue, row }) => {
        const name = getValue() as string;
        const appId = row.original.id;
        const description = row.original.description;
        return (
          <AppLink
            appId={appId}
            name={name}
            showDescription={true}
            description={description}
          />
        );
      },
    },
    {
      accessorKey: 'creatorUser.name',
      header: 'Creator',
      enableSorting: false,
      enableColumnFilter: false,
      columnType: 'string',
      cell: ({ row }) => {
        const creatorUser = row.original.creatorUser;
        return (
          <UserLink
            userId={creatorUser.id}
            name={creatorUser.name}
            email={creatorUser.email}
          />
        );
      },
    },
    {
      accessorKey: 'appEmailCampaigns',
      header: 'App Campaigns',
      enableSorting: false,
      enableColumnFilter: false,
      columnType: 'string',
      cell: ({ row }) => {
        const campaigns = row.original.appEmailCampaigns;
        return (
          <EmailCell
            emails={campaigns}
            label="campaign"
            emptyText="No campaigns"
          />
        );
      },
    },
    {
      accessorKey: 'ownerEmailCampaigns',
      header: 'Owner Campaigns',
      enableSorting: false,
      enableColumnFilter: false,
      columnType: 'string',
      cell: ({ row }) => {
        const campaigns = row.original.ownerEmailCampaigns;
        return (
          <EmailCell
            emails={campaigns}
            label="campaign"
            emptyText="No campaigns"
          />
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
      accessorKey: 'totalUsers',
      header: 'Users',
      enableSorting: true,
      enableColumnFilter: true,
      columnType: 'number',
      cell: ({ getValue }) => {
        const count = toNumber(getValue());
        return <IntCell value={count} />;
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
      accessorKey: 'totalReferralCodes',
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
      accessorKey: 'createdAt',
      header: 'Created At',
      enableSorting: true,
      enableColumnFilter: true,
      columnType: 'date',
      size: 144,
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
      size: 144,
      cell: ({ getValue }) => {
        const date = getValue() as Date;
        return <DateCell date={date} />;
      },
    },
  ];

export default function AppEarningsTable() {
  const scheduleEmailCampaignMutation =
    api.admin.emailCampaigns.scheduleForApps.useMutation();

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="p-6">
        <StatefulDataTable
          columns={columns}
          trpcQuery={api.admin.earnings.getAppEarningsWithPagination.useQuery}
          showControls={true}
          getRowId={row => row.id}
          actions={[
            {
              id: 'send-limbo-email-campaign',
              label: 'Send Limbo Email Campaign',
              action: (tableState: TableState) => {
                scheduleEmailCampaignMutation.mutate({
                  campaignKey: 'limbo-app-reminder',
                  appIds: tableState.selectedRowIds,
                });
              },
            },
          ]}
          enableRowSelection={true}
        />
      </div>
    </div>
  );
}
