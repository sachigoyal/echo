'use client';

import * as React from 'react';
import type { TypedColumnDef } from './BaseTable';

export function createCheckboxColumn<TData>(): TypedColumnDef<TData, unknown> {
  return {
    id: 'select',
    columnType: 'boolean',
    size: 20,
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? true : false)
        }
        ref={el => {
          if (el)
            el.indeterminate =
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected();
        }}
        onChange={e => table.toggleAllPageRowsSelected(e.target.checked)}
        aria-label="Select all"
        className="h-4 w-4 cursor-pointer"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={e => row.toggleSelected(e.target.checked)}
        aria-label="Select row"
        className="h-4 w-4 cursor-pointer"
      />
    ),
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
  };
}
