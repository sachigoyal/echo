'use client';

import * as React from 'react';
import {
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
import { BaseTable } from './BaseTable';
import { PaginationParams, PaginatedResponse } from '@/services/lib/pagination';
import { MultiSortParams, toMultiSortParams } from '@/services/lib/sorting';
import { FilterParams, toFilterParams } from '@/services/lib/filtering';
import { TypedColumnDef } from './BaseTable';
import { ActionConfig, ActionGroup } from './ActionControls';
import { createCheckboxColumn } from './CheckBoxColumn';

// TRPC useQuery hook type - accepts the raw TRPC useQuery function
export type TRPCUseQuery<TData> = (
  params: PaginationParams & MultiSortParams & FilterParams
) => {
  data?: PaginatedResponse<TData>;
  isLoading: boolean;
  error?: any;
};

interface StatefulDataTableProps<TData, TValue> {
  columns: TypedColumnDef<TData, TValue>[];
  data?: TData[];
  // TRPC integration - if provided, will manage data fetching automatically
  trpcQuery?: TRPCUseQuery<TData>;
  actions?: ActionConfig[];
  actionGroups?: ActionGroup[];
  // Loading state
  isLoading?: boolean;
  // Controls configuration
  showControls?: boolean;
  // Table title
  title?: string;
  // Row selection
  enableRowSelection?: boolean;
  // Row ID accessor for unique keys
  getRowId?: (row: TData) => string;
}

export function StatefulDataTable<TData, TValue>({
  columns,
  data,
  trpcQuery,
  isLoading = false,
  showControls = true,
  title,
  actions,
  actionGroups,
  enableRowSelection = false,
  getRowId,
}: StatefulDataTableProps<TData, TValue>) {
  // Internal state management if external state is not provided
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    []
  );
  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({});

  // Current state values (external or internal)
  const currentSorting = internalSorting;
  const currentColumnFilters = internalColumnFilters;
  const currentPagination = internalPagination;

  // TRPC query parameters
  const queryParams = React.useMemo(() => {
    const paginationParams: PaginationParams = {
      page: currentPagination.pageIndex,
      page_size: currentPagination.pageSize,
    };
    const sortParams = toMultiSortParams(currentSorting);
    const filterParams = toFilterParams(currentColumnFilters);

    return {
      ...paginationParams,
      ...sortParams,
      ...filterParams,
    };
  }, [currentPagination, currentSorting, currentColumnFilters]);

  // Use TRPC query if provided
  const trpcQueryResult = trpcQuery?.(queryParams);

  // Create checkbox column for row selection
  const checkboxColumn: TypedColumnDef<TData, unknown> = React.useMemo(
    () => createCheckboxColumn<TData>(),
    []
  );

  // Combine columns with checkbox column if row selection is enabled
  const finalColumns = React.useMemo(() => {
    if (enableRowSelection) {
      return [checkboxColumn, ...columns] as TypedColumnDef<TData, TValue>[];
    }
    return columns;
  }, [enableRowSelection, checkboxColumn, columns]);

  // Determine which data to use
  const tableData = trpcQuery
    ? (trpcQueryResult?.data?.items ?? [])
    : (data ?? []);
  const tableIsLoading = trpcQuery
    ? (trpcQueryResult?.isLoading ?? false)
    : isLoading;
  const tablePageCount = trpcQuery
    ? trpcQueryResult?.data
      ? Math.ceil(
          trpcQueryResult.data.total_count / trpcQueryResult.data.page_size
        )
      : 0
    : 0;

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
    getRowId: getRowId,
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
  });

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
  );
}
