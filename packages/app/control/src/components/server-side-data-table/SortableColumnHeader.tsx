'use client';

import * as React from 'react';
import { Column } from '@tanstack/react-table';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SortableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  children: React.ReactNode;
  className?: string;
}

export function SortableColumnHeader<TData, TValue>({
  column,
  children,
  className,
}: SortableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{children}</div>;
  }

  const sortDirection = column.getIsSorted();

  const handleSort = () => {
    if (sortDirection === 'asc') {
      column.toggleSorting(true); // Sort descending
    } else if (sortDirection === 'desc') {
      column.clearSorting(); // Clear sorting
    } else {
      column.toggleSorting(false); // Sort ascending
    }
  };

  const getSortIcon = () => {
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4" />;
    } else if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4" />;
    } else {
      return <ChevronsUpDown className="h-4 w-4 opacity-50" />;
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSort}
      className={cn(
        'h-auto p-0 font-semibold text-left justify-start hover:bg-transparent',
        'flex items-center gap-2 w-full',
        sortDirection && 'text-purple-700',
        className
      )}
    >
      <span className="flex-1">{children}</span>
      {getSortIcon()}
    </Button>
  );
}
