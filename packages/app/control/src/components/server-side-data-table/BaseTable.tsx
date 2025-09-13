"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  Table as TanStackTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "./PaginationControls"
import { MultiSortControls } from "./SortControls"
import { MultiFilterControls, ColumnType } from "./FilterControls"
import { TableHeader as CustomTableHeader } from "./TableHeader"

// Define TypedColumnDef as an intersection type to guarantee columnType exists
export type TypedColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  columnType: ColumnType
}

interface BaseTableProps<TData, TValue> {
  table: TanStackTable<TData>
  columns: TypedColumnDef<TData, TValue>[]
  isLoading?: boolean
  skeletonRows?: number
  showControls?: boolean
  title?: string
} 


export function BaseTable<TData, TValue>({
  table,
  columns,
  isLoading = false,
  skeletonRows = 10,
  showControls = true,
  title = "Data Table",
}: BaseTableProps<TData, TValue>) {
  const defaultColumns = React.useMemo(() => 
    columns.map(col => {
      if ('accessorKey' in col && typeof col.accessorKey === 'string') {
        return col.accessorKey
      }
      if ('id' in col && typeof col.id === 'string') {
        return col.id
      }
      return 'unknown'
    }).filter(col => col !== 'unknown'),
    [columns]
  )

  // Create column configs from typed columns
  const columnConfigs = React.useMemo(() => 
    columns.map(col => {
      let name: string
      if ('accessorKey' in col && typeof col.accessorKey === 'string') {
        name = col.accessorKey
      } else if ('id' in col && typeof col.id === 'string') {
        name = col.id
      } else {
        name = 'unknown'
      }
      
      return {
        name,
        type: col.columnType
      }
    }).filter(config => config.name !== 'unknown'),
    [columns]
  )

  // State for controlling popover visibility
  const [sortPopoverOpen, setSortPopoverOpen] = React.useState(false)
  const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false)

  return (
    <div className="space-y-0">
      <div className="overflow-hidden rounded-md border">
        {showControls && defaultColumns.length > 0 && (
          <CustomTableHeader
            title={title}
            table={table}
            availableColumns={defaultColumns}
            columnConfigs={columnConfigs}
            onSortClick={() => setSortPopoverOpen(!sortPopoverOpen)}
            onFilterClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
          />
        )}
        
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${index}-${colIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls table={table} />
      
      {/* Render popovers outside the table for proper positioning */}
      {showControls && defaultColumns.length > 0 && (
        <>
          <MultiSortControls 
            table={table} 
            availableColumns={defaultColumns}
            isOpen={sortPopoverOpen}
            onOpenChange={setSortPopoverOpen}
          />
          <MultiFilterControls 
            table={table} 
            availableColumns={defaultColumns} 
            columnConfigs={columnConfigs}
            isOpen={filterPopoverOpen}
            onOpenChange={setFilterPopoverOpen}
          />
        </>
      )}
    </div>
  )
}
