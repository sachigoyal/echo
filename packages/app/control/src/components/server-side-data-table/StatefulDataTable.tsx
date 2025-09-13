"use client"

import * as React from "react"
import {
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from "@tanstack/react-table"

import { BaseTable } from "./BaseTable"
import { PaginationParams, PaginatedResponse } from "@/services/lib/pagination"
import { MultiSortParams, toMultiSortParams } from "@/services/lib/sorting"
import { FilterParams, toFilterParams } from "@/services/lib/filtering"
import { TypedColumnDef } from "./BaseTable"
import { ActionConfig, ActionGroup } from "./ActionControls"
import { createCheckboxColumn } from "./CheckBoxColumn"

// TRPC function type that accepts standardized params and returns paginated response
export type TRPCDataFetcher<TData> = (
  params: PaginationParams & MultiSortParams & FilterParams
) => Promise<PaginatedResponse<TData>>

interface StatefulDataTableProps<TData, TValue> {
  columns: TypedColumnDef<TData, TValue>[]
  data?: TData[]
  // TRPC integration - if provided, will manage data fetching automatically
  dataFetcher?: TRPCDataFetcher<TData>
  actions?: ActionConfig[]
  actionGroups?: ActionGroup[]
  // Loading state
  isLoading?: boolean
  // Controls configuration
  showControls?: boolean
  // Table title
  title?: string
  // Row selection
  enableRowSelection?: boolean
}

export function StatefulDataTable<TData, TValue>({
  columns,
  data,
  dataFetcher,
  isLoading = false,
  showControls = true,
  title,
  actions,
  actionGroups,
  enableRowSelection = false,
}: StatefulDataTableProps<TData, TValue>) {
  // Internal state management if external state is not provided
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([])
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})
  // TRPC integration state
  const [fetchedData, setFetchedData] = React.useState<TData[]>([])
  const [internalLoading, setInternalLoading] = React.useState(false)
  const [internalPageCount, setInternalPageCount] = React.useState<number>()

  // Current state values (external or internal)
  const currentSorting = internalSorting
  const currentColumnFilters = internalColumnFilters
  const currentPagination = internalPagination

  // Create checkbox column for row selection
  const checkboxColumn: TypedColumnDef<TData, unknown> = React.useMemo(() => 
    createCheckboxColumn<TData>(), []
  )

  // Combine columns with checkbox column if row selection is enabled
  const finalColumns = React.useMemo(() => {
    if (enableRowSelection) {
      return [checkboxColumn, ...columns] as TypedColumnDef<TData, TValue>[]
    }
    return columns
  }, [enableRowSelection, checkboxColumn, columns])

  // Fetch data when using TRPC integration
  React.useEffect(() => {
    if (!dataFetcher) return

    const fetchData = async () => {
      setInternalLoading(true)
      
      const paginationParams: PaginationParams = {
        page: currentPagination.pageIndex,
        page_size: currentPagination.pageSize,
      }
      
      const sortParams = toMultiSortParams(currentSorting)
      const filterParams = toFilterParams(currentColumnFilters)
      
      const response = await dataFetcher({
        ...paginationParams,
        ...sortParams,
        ...filterParams,
      })
      
      setFetchedData(response.items)
      setInternalPageCount(Math.ceil(response.total_count / response.page_size))
      setInternalLoading(false)
    }

    fetchData().catch(console.error)
  }, [dataFetcher, currentPagination, currentSorting, currentColumnFilters])

  // Determine which data to use
  const tableData = dataFetcher ? fetchedData : (data ?? [])
  const tableIsLoading = dataFetcher ? internalLoading : isLoading
  const tablePageCount = dataFetcher ? internalPageCount : 0

  const table = useReactTable({
    data: tableData,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableSortingRemoval: true,
    enableMultiSort: true,
    enableRowSelection: enableRowSelection,
    // Use external state if provided, otherwise use internal state
    state: {
      sorting: currentSorting,
      columnFilters: currentColumnFilters,
      pagination: currentPagination,
      rowSelection: internalRowSelection,
    },
    // Use external handlers if provided, otherwise use internal handlers
    onSortingChange: setInternalSorting,
    onColumnFiltersChange: setInternalColumnFilters,
    onPaginationChange: setInternalPagination,
    onRowSelectionChange: setInternalRowSelection,
    pageCount: tablePageCount,
  })

  return (
    <BaseTable 
      table={table} 
      columns={finalColumns} 
      isLoading={tableIsLoading}
      showControls={showControls}
      title={title}
      actions={actions}
      actionGroups={actionGroups}
    />
  )
}
