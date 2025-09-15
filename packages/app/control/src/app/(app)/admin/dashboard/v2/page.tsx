"use client"

import React from 'react'
import { 
  StatefulDataTable
} from '@/components/server-side-data-table'
import { getUsersWithPagination, User } from '@/components/server-side-data-table/example-trpc'
import { TableState, TypedColumnDef } from '@/components/server-side-data-table/BaseTable'
import { PaginationParams, PaginatedResponse } from '@/services/lib/pagination'
import { MultiSortParams } from '@/services/lib/sorting'
import { FilterParams } from '@/services/lib/filtering'
import { UseQueryResult } from '@tanstack/react-query'

// Mock TRPC query hook for demonstration
const useMockUsersQuery = (params: PaginationParams & MultiSortParams & FilterParams): UseQueryResult<PaginatedResponse<User>, Error> => {
  const [data, setData] = React.useState<PaginatedResponse<User> | undefined>()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    setIsLoading(true)
    getUsersWithPagination(params)
      .then(result => {
        setData(result)
        setError(null)
      })
      .catch(err => {
        setError(err)
        setData(undefined)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [params])

  return {
    data,
    isLoading,
    error,
    isError: !!error,
    isSuccess: !!data && !error,
  } as UseQueryResult<PaginatedResponse<User>, Error>
}

// Define columns for the users table
const columns: TypedColumnDef<User, string | number | boolean | Date>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableSorting: true,
    columnType: "string",
  },
  {
    accessorKey: "email", 
    header: "Email",
    enableSorting: true,
    columnType: "string",
  },
  {
    accessorKey: "role",
    header: "Role",
    enableSorting: true,
    columnType: "string",
    cell: ({ getValue }) => {
      const role = getValue() as string
      const roleColors = {
        admin: "bg-red-100 text-red-800",
        user: "bg-blue-100 text-blue-800", 
        viewer: "bg-gray-100 text-gray-800"
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors]}`}>
          {role}
        </span>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    enableSorting: true,
    columnType: "date",
    cell: ({ getValue }) => new Date(getValue() as string | number | Date).toLocaleDateString(),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    enableSorting: true,
    columnType: "boolean",
    cell: ({ getValue }) => {
      const isActive = getValue() as boolean
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      )
    },
  },
  {
    accessorKey: "loginCount",
    header: "Login Count",
    enableSorting: true,
    columnType: "number",
    cell: ({ getValue }) => {
      const count = getValue() as number
      return (
        <span className="font-mono text-sm">
          {count.toLocaleString()}
        </span>
      )
    },
  },
]

export default function DashboardV2Page() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard v2</h1>
        <p className="text-gray-600 mt-2">
          Demonstration of StatefulDataTable with external controls and TRPC integration
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Server-side pagination, sorting, and filtering with integrated multi-controls
          </p>
        </div>
        
        <div className="p-6">
          <StatefulDataTable
            columns={columns}
            trpcQuery={useMockUsersQuery}
            showControls={true}
            actions={[
              {
                id: "edit",
                label: "Edit",
                action: ( tableState: TableState ) => {
                  console.log("Edit", tableState)
                }
              },
            ]} 
            enableRowSelection={true} />

        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Features Demonstrated
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Integrated multi-sort controls with collapsible interface
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Integrated multi-filter controls with dynamic column filtering
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Built-in pagination controls with page size selection
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Server-side data processing with TRPC integration
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Automatic loading states and responsive design
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Visual badges showing active sorts and filters
          </li>
        </ul>
      </div>
    </div>
  )
}
