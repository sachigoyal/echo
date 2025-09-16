'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  Table as TanStackTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from './PaginationControls';
import { MultiSortControls } from './SortControls';
import { MultiFilterControls, ColumnType } from './FilterControls';
import { TableHeader as CustomTableHeader } from './TableHeader';
import { ActionConfig, ActionGroup, TableState } from './ActionControls';
import { SortableColumnHeader } from './SortableColumnHeader';
import { getFilterableColumnConfigs, getSortableColumns } from './utils';

// Re-export for convenience
export type { ActionConfig, ActionGroup, TableState };

// Define TypedColumnDef as an intersection type to guarantee columnType exists
export type TypedColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  columnType: ColumnType;
};

interface BaseTableProps<TData, TValue> {
  table: TanStackTable<TData>;
  columns: TypedColumnDef<TData, TValue>[];
  isLoading?: boolean;
  skeletonRows?: number;
  showControls?: boolean;
  title?: string;
  actions?: ActionConfig[];
  actionGroups?: ActionGroup[];
}

export function BaseTable<TData, TValue>({
  table,
  columns,
  isLoading = false,
  skeletonRows = 3,
  showControls = true,
  title = 'Data Table',
  actions = [],
  actionGroups = [],
}: BaseTableProps<TData, TValue>) {
  // Get sortable and filterable columns using utility functions
  const sortableColumns = React.useMemo(
    () => getSortableColumns(columns),
    [columns]
  );
  const filterableColumnConfigs = React.useMemo(
    () => getFilterableColumnConfigs(columns),
    [columns]
  );

  // State for controlling popover visibility
  const [sortPopoverOpen, setSortPopoverOpen] = React.useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false);

  return (
    <div className="space-y-0">
      <div className="overflow-hidden rounded-md border">
        {showControls && (
          <CustomTableHeader
            title={title}
            table={table}
            onSortClick={() => setSortPopoverOpen(!sortPopoverOpen)}
            onFilterClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
            actions={actions}
            actionGroups={actionGroups}
          />
        )}

        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const isCheckboxColumn = header.column.id === 'select';
                  const headerClassName = isCheckboxColumn
                    ? 'w-10 min-w-10 max-w-10'
                    : 'w-36 min-w-36 max-w-36';

                  return (
                    <TableHead key={header.id} className={headerClassName}>
                      {header.isPlaceholder ? null : (
                        <SortableColumnHeader column={header.column}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </SortableColumnHeader>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {columns.map((column, colIndex) => {
                    const isCheckboxColumn = column.id === 'select';
                    const cellClassName = isCheckboxColumn
                      ? 'w-5 min-w-5 max-w-5'
                      : 'w-36 min-w-36 max-w-36';

                    return (
                      <TableCell key={colIndex} className={cellClassName}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map(cell => {
                    const isCheckboxColumn = cell.column.id === 'select';
                    const cellClassName = isCheckboxColumn
                      ? 'w-5 min-w-5 max-w-5'
                      : 'w-36 min-w-36 max-w-36';

                    return (
                      <TableCell key={cell.id} className={cellClassName}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls table={table} />

      {/* Render popovers outside the table for proper positioning */}
      {showControls && (
        <>
          {
            <MultiSortControls
              table={table}
              availableColumns={sortableColumns}
              isOpen={sortPopoverOpen}
              onOpenChange={setSortPopoverOpen}
            />
          }
          {
            <MultiFilterControls
              table={table}
              availableColumns={filterableColumnConfigs.map(
                config => config.name
              )}
              columnConfigs={filterableColumnConfigs}
              isOpen={filterPopoverOpen}
              onOpenChange={setFilterPopoverOpen}
            />
          }
        </>
      )}
    </div>
  );
}
