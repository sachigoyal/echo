'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { Table as TanStackTable } from '@tanstack/react-table';
import { SortAsc, ArrowUp, ArrowDown, Plus, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface MultiSortControlsProps<TData> {
  table: TanStackTable<TData>;
  availableColumns: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiSortControls<TData>({
  table,
  availableColumns,
  isOpen,
  onOpenChange,
}: MultiSortControlsProps<TData>) {
  const sorting = table.getState().sorting;

  const addSort = () => {
    const availableColumn = availableColumns.find(
      col => !sorting.some(sort => sort.id === col)
    );
    if (availableColumn) {
      table.setSorting([...sorting, { id: availableColumn, desc: false }]);
    }
  };

  const updateSort = (index: number, columnId: string) => {
    const newSorting = [...sorting];
    newSorting[index] = { ...newSorting[index], id: columnId };
    table.setSorting(newSorting);
  };

  const toggleDirection = (index: number) => {
    const newSorting = [...sorting];
    newSorting[index] = { ...newSorting[index], desc: !newSorting[index].desc };
    table.setSorting(newSorting);
  };

  const removeSort = (index: number) => {
    const newSorting = sorting.filter((_, i) => i !== index);
    table.setSorting(newSorting);
  };

  const clearAllSorts = () => {
    table.setSorting([]);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-96 bg-white rounded-lg shadow-lg border border-slate-200 p-0"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                <SortAsc className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-slate-700">Sort Options</span>
              {sorting.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  {sorting.length}
                </span>
              )}
            </div>
            {sorting.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllSorts}
                className="h-7 px-2 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {sorting.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sorting.map((sort, index) => (
                <Badge
                  key={`${sort.id}-${index}`}
                  variant="secondary"
                  className="bg-purple-100 text-purple-800 border-purple-200"
                >
                  {sort.id} {sort.desc ? '↓' : '↑'}
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {sorting.map((sort, index) => (
              <div
                key={`sort-${index}`}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200"
              >
                <span className="text-xs text-purple-600 font-medium w-8">
                  {index + 1}.
                </span>

                <Select
                  value={sort.id}
                  onValueChange={value => updateSort(index, value)}
                >
                  <SelectTrigger className="h-8 border-slate-200 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDirection(index)}
                  className="h-8 px-2 border-slate-200 hover:bg-purple-50"
                >
                  {sort.desc ? (
                    <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUp className="h-3 w-3" />
                  )}
                  {sort.desc ? 'Desc' : 'Asc'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeSort(index)}
                  className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {sorting.length < availableColumns.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={addSort}
              className="w-full h-8 border-dashed border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Sort
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
