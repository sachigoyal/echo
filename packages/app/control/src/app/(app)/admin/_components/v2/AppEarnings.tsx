"use client"

import React from 'react'
import { 
  StatefulDataTable
} from '@/components/server-side-data-table'
import { TableState, TypedColumnDef } from '@/components/server-side-data-table/BaseTable'
import { api } from '@/trpc/client'

// Define AppEarnings type based on the service function
export interface AppEarnings {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  creatorUser: {
    id: string
    name: string | null
    email: string
  }
  appEmailCampaigns: string[]
  ownerEmailCampaigns: string[]
  totalTransactions: number
  totalRevenue: number
  totalAppProfit: number
  totalMarkupProfit: number
  totalReferralProfit: number
  totalReferralCodes: number
}

// Helper function to safely convert values to numbers
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (typeof value === 'bigint') return Number(value)
  return 0
}

// Define columns for the app earnings table
const columns: TypedColumnDef<AppEarnings, string | number | boolean | Date>[] = [
  {
    accessorKey: "name",
    header: "App Name",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "string",
    cell: ({ getValue }) => {
      const name = getValue() as string
      return (
        <span className="font-medium text-gray-900">
          {name}
        </span>
      )
    },
  },
  {
    accessorKey: "creatorUser.name",
    header: "Creator",
    enableSorting: false,
    enableColumnFilter: false,
    columnType: "string",
    cell: ({ row }) => {
      const creatorUser = row.original.creatorUser
      return (
        <div className="flex flex-col">
          <span className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
            {creatorUser.name || <span className="text-gray-400 italic">No name</span>}
          </span>
          <span className="text-xs text-gray-500">{creatorUser.email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    enableSorting: false,
    enableColumnFilter: true,
    columnType: "string",
    cell: ({ getValue }) => {
      const description = getValue() as string | null
      return description ? (
        <span className="text-sm text-gray-600 max-w-xs truncate">
          {description}
        </span>
      ) : (
        <span className="text-gray-400 italic text-sm">No description</span>
      )
    },
  },
  {
    accessorKey: "appEmailCampaigns",
    header: "App Campaigns",
    enableSorting: false,
    enableColumnFilter: false,
    columnType: "string",
    cell: ({ row }) => {
      const campaigns = row.original.appEmailCampaigns
      return (
        <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
          {campaigns.length}
        </span>
      )
    },
  },
  {
    accessorKey: "ownerEmailCampaigns",
    header: "Owner Campaigns",
    enableSorting: false,
    enableColumnFilter: false,
    columnType: "string",
    cell: ({ row }) => {
      const campaigns = row.original.ownerEmailCampaigns
      return (
        <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded">
          {campaigns.length}
        </span>
      )
    },
  },
  {
    accessorKey: "totalTransactions",
    header: "Transactions",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const count = toNumber(getValue())
      return (
        <span className="font-mono text-sm">
          {count.toLocaleString()}
        </span>
      )
    },
  },
  {
    accessorKey: "totalRevenue",
    header: "Total Revenue",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      return (
        <span className="font-mono text-sm font-medium">
          ${amount.toFixed(4)}
        </span>
      )
    },
  },
  {
    accessorKey: "totalAppProfit",
    header: "App Profit",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      return (
        <span className="font-mono text-sm text-green-600">
          ${amount.toFixed(4)}
        </span>
      )
    },
  },
  {
    accessorKey: "totalMarkupProfit",
    header: "Markup Profit",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      return (
        <span className="font-mono text-sm text-blue-600">
          ${amount.toFixed(4)}
        </span>
      )
    },
  },
  {
    accessorKey: "totalReferralProfit",
    header: "Referral Profit",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      return (
        <span className="font-mono text-sm text-purple-600">
          ${amount.toFixed(4)}
        </span>
      )
    },
  },
  {
    accessorKey: "totalReferralCodes",
    header: "Referral Codes",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const count = toNumber(getValue())
      return (
        <span className="font-mono text-sm">
          {count.toLocaleString()}
        </span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "date",
    cell: ({ getValue }) => {
      const date = getValue() as Date
      if (!date) return <span className="text-gray-400 italic">No date</span>
      return (
        <span className="font-mono text-sm text-gray-600">
          {new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </span>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated At",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "date",
    cell: ({ getValue }) => {
      const date = getValue() as Date
      if (!date) return <span className="text-gray-400 italic">No date</span>
      return (
        <span className="font-mono text-sm text-gray-600">
          {new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </span>
      )
    },
  },
]

export default function AppEarningsTable() {
  return (
    <div className="container mx-auto py-6 px-4">
        <div className="p-6">
          <StatefulDataTable
            columns={columns}
            trpcQuery={api.admin.earnings.getAppEarningsWithPagination.useQuery}
            showControls={true}
            getRowId={(row) => row.id}
            actions={[
              {
                id: "view-app-details",
                label: "View App Details",
                action: ( tableState: TableState ) => {
                  console.log("View app details", tableState)
                }
              },
              {
                id: "view-creator-details",
                label: "View Creator Details",
                action: ( tableState: TableState ) => {
                  console.log("View creator details", tableState)
                }
              },
            ]} 
            enableRowSelection={true} />

        </div>
    </div>
  )
}
