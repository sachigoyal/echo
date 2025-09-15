"use client"

import React from 'react'
import { 
  StatefulDataTable
} from '@/components/server-side-data-table'
import { TableState, TypedColumnDef } from '@/components/server-side-data-table/BaseTable'
import { api } from '@/trpc/client'

// Define UserEarnings type based on the service function
export interface UserEarnings {
  id: string
  name: string | null
  email: string
  totalRevenue: number
  totalAppProfit: number
  totalMarkupProfit: number
  totalReferralProfit: number
  transactionCount: number
  uniqueEmailCampaigns: string[]
  referralCodesGenerated: number
  referredUsersCount: number
  totalCompletedPayouts: number
}


// Helper function to safely convert values to numbers
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (typeof value === 'bigint') return Number(value)
  return 0
}

// Define columns for the user earnings table
const columns: TypedColumnDef<UserEarnings, string | number | boolean | Date>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "string",
    cell: ({ getValue }) => {
      const name = getValue() as string | null
      return name || <span className="text-gray-400 italic">No name</span>
    },
  },
  {
    accessorKey: "email", 
    header: "Email",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "string",
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
    accessorKey: "transactionCount",
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
    accessorKey: "referralCodesGenerated",
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
    accessorKey: "referredUsersCount",
    header: "Referred Users",
    enableSorting: true,
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
    accessorKey: "totalCompletedPayouts",
    header: "Payouts",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      return (
        <span className="font-mono text-sm text-orange-600">
          ${amount.toFixed(2)}
        </span>
      )
    },
  },
]

export default function UserEarningsTable() {
  return (
    <div className="container mx-auto py-6 px-4">
        <div className="p-6">
          <StatefulDataTable
            columns={columns}
            trpcQuery={api.admin.earnings.getUserEarningsWithPagination.useQuery}
            showControls={true}
            getRowId={(row) => row.id}
            actions={[
              {
                id: "view-details",
                label: "View Details",
                action: ( tableState: TableState ) => {
                  console.log("View user details", tableState)
                }
              },
            ]} 
            enableRowSelection={true} />

        </div>
    </div>
  )
}
