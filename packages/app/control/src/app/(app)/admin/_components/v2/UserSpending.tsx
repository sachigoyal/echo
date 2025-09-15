"use client"

import React from 'react'
import { 
  StatefulDataTable
} from '@/components/server-side-data-table'
import { TableState, TypedColumnDef } from '@/components/server-side-data-table/BaseTable'
import { api } from '@/trpc/client'

// Define UserSpending type based on the service function
export interface UserSpending {
  id: string
  name: string | null
  email: string
  totalSpent: number
  balance: number
  totalPaid: number
  createdAt: Date
  updatedAt: Date
}

// Helper function to safely convert values to numbers
const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  if (typeof value === 'bigint') return Number(value)
  return 0
}

// Define columns for the user spending table
const columns: TypedColumnDef<UserSpending, string | number | boolean | Date>[] = [
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
    accessorKey: "totalSpent",
    header: "Total Spent",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      return (
        <span className="font-mono text-sm font-medium text-red-600">
          ${amount.toFixed(4)}
        </span>
      )
    },
  },
  {
    accessorKey: "balance",
    header: "Current Balance",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      const isPositive = amount >= 0
      return (
        <span className={`font-mono text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          ${amount.toFixed(4)}
        </span>
      )
    },
  },
  {
    accessorKey: "totalPaid",
    header: "Total Paid",
    enableSorting: true,
    enableColumnFilter: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const amount = toNumber(getValue())
      return (
        <span className="font-mono text-sm font-medium text-blue-600">
          ${amount.toFixed(2)}
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

export default function UserSpendingTable() {
  return (
    <div className="container mx-auto py-6 px-4">
        <div className="p-6">
          <StatefulDataTable
            columns={columns}
            trpcQuery={api.admin.spending.getUserSpendingWithPagination.useQuery}
            showControls={true}
            getRowId={(row) => row.id}
            actions={[
              {
                id: "view-details",
                label: "View Details",
                action: ( tableState: TableState ) => {
                  console.log("View user spending details", tableState)
                }
              },
            ]} 
            enableRowSelection={true} />

        </div>
    </div>
  )
}
