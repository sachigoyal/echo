'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { Table as TanStackTable } from '@tanstack/react-table';
import { Filter, X, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { FilterOperator } from '@/services/lib/filtering';

// Enhanced filter structure to support operators
interface FilterConfig {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

// Column type definitions for input validation
export type ColumnType = 'string' | 'number' | 'boolean' | 'date';

interface ColumnConfig {
  name: string;
  type: ColumnType;
}

// Operator display labels
const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not Equals',
  contains: 'Contains',
  not_contains: 'Not Contains',
  starts_with: 'Starts With',
  ends_with: 'Ends With',
  greater_than: 'Greater Than',
  less_than: 'Less Than',
  greater_than_or_equal: 'Greater Than or Equal',
  less_than_or_equal: 'Less Than or Equal',
  in: 'In',
  not_in: 'Not In',
  is_null: 'Is Null',
  is_not_null: 'Is Not Null',
};

// Helper function to determine input type based on operator and column type
const getInputType = (
  operator: FilterOperator,
  columnType?: ColumnType
): string => {
  if (operator === 'is_null' || operator === 'is_not_null') return 'text';

  switch (columnType) {
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'boolean':
      return 'text'; // Will use select for boolean
    default:
      return 'text';
  }
};

// Helper function to validate input based on column type
const validateInput = (
  value: string,
  columnType?: ColumnType,
  operator?: FilterOperator
): string => {
  if (operator === 'is_null' || operator === 'is_not_null') return value;

  switch (columnType) {
    case 'number':
      // Only allow numbers, decimals, and negative sign
      return value.replace(/[^0-9.-]/g, '');
    default:
      return value;
  }
};

// Helper function to get operators valid for a column type
const getValidOperators = (columnType?: ColumnType): FilterOperator[] => {
  const allOperators: FilterOperator[] = [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'in',
    'not_in',
    'is_null',
    'is_not_null',
  ];

  switch (columnType) {
    case 'number':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_than_or_equal',
        'less_than_or_equal',
        'in',
        'not_in',
        'is_null',
        'is_not_null',
      ];
    case 'boolean':
      return ['equals', 'not_equals', 'is_null', 'is_not_null'];
    case 'date':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_than_or_equal',
        'less_than_or_equal',
        'is_null',
        'is_not_null',
      ];
    case 'string':
      return [
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'is_null',
        'is_not_null',
        'equals',
        'not_equals',
      ];
    default:
      return allOperators;
  }
};

interface MultiFilterControlsProps<TData> {
  table: TanStackTable<TData>;
  availableColumns: string[];
  columnConfigs?: ColumnConfig[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Multi-Filter Controls Component
export function MultiFilterControls<TData>({
  table,
  availableColumns,
  columnConfigs = [],
  isOpen,
  onOpenChange,
}: MultiFilterControlsProps<TData>) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newFilter, setNewFilter] = React.useState<Omit<FilterConfig, 'id'>>({
    column: '',
    operator: 'contains',
    value: '',
  });

  // Derive filters from table's column filters
  const columnFilters = table.getState().columnFilters;
  const filters = React.useMemo<FilterConfig[]>(() => {
    return columnFilters.map((columnFilter, index) => {
      // Parse structured filter value: "operator:value" or just "operator" for null checks
      const filterValue = String(columnFilter.value || '');
      const [operator, ...valueParts] = filterValue.split(':');
      const value = valueParts.join(':'); // Rejoin in case value contains colons

      return {
        id: `filter-${columnFilter.id}-${index}`,
        column: columnFilter.id,
        operator: (operator as FilterOperator) || 'contains',
        value: value || '',
      };
    });
  }, [columnFilters]);

  // Get column type helper
  const getColumnType = (columnName: string): ColumnType => {
    const config = columnConfigs.find(c => c.name === columnName);
    return config?.type || 'string';
  };

  const openAddFilterModal = () => {
    const availableColumn =
      availableColumns.find(
        col => !filters.some(filter => filter.column === col)
      ) || availableColumns[0];

    setNewFilter({
      column: availableColumn || '',
      operator: 'contains',
      value: '',
    });
    setIsModalOpen(true);
  };

  const handleAddFilter = () => {
    if (
      newFilter.column &&
      (newFilter.value.trim() !== '' ||
        newFilter.operator === 'is_null' ||
        newFilter.operator === 'is_not_null')
    ) {
      const currentFilters = table.getState().columnFilters;
      const structuredValue =
        newFilter.operator === 'is_null' || newFilter.operator === 'is_not_null'
          ? newFilter.operator
          : `${newFilter.operator}:${newFilter.value}`;

      const newColumnFilter = {
        id: newFilter.column,
        value: structuredValue,
      };
      table.setColumnFilters([...currentFilters, newColumnFilter]);
      setIsModalOpen(false);
      setNewFilter({ column: '', operator: 'contains', value: '' });
    }
  };

  const handleCancelAddFilter = () => {
    setIsModalOpen(false);
    setNewFilter({ column: '', operator: 'contains', value: '' });
  };

  const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
    const currentFilters = table.getState().columnFilters;
    const updatedFilters = [...currentFilters];
    const currentFilter = filters[index];
    const updatedFilter = { ...currentFilter, ...updates };

    const structuredValue =
      updatedFilter.operator === 'is_null' ||
      updatedFilter.operator === 'is_not_null'
        ? updatedFilter.operator
        : `${updatedFilter.operator}:${updatedFilter.value}`;

    updatedFilters[index] = {
      id: updatedFilter.column,
      value: structuredValue,
    };

    table.setColumnFilters(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const currentFilters = table.getState().columnFilters;
    const updatedFilters = currentFilters.filter((_, i) => i !== index);
    table.setColumnFilters(updatedFilters);
  };

  const clearAllFilters = () => {
    table.setColumnFilters([]);
  };

  return (
    <>
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
            onClick={() => onOpenChange(false)}
          >
            <div
              className="w-[500px] bg-white rounded-lg shadow-lg border border-slate-200 p-0"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-50 text-blue-600">
                      <Filter className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-semibold text-slate-700">
                      Filter Options
                    </span>
                    {filters.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {filters.length}
                      </span>
                    )}
                  </div>
                  {filters.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {filters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {filters.map(filter => (
                      <Badge
                        key={filter.id}
                        variant="secondary"
                        className="bg-blue-100 text-blue-700 border-blue-200 font-medium"
                      >
                        <span className="font-medium">{filter.column}</span>{' '}
                        {OPERATOR_LABELS[filter.operator].toLowerCase()}{' '}
                        <span className="text-slate-900">
                          &quot;{filter.value?.substring(0, 10)}
                          {filter.value?.length > 10 ? '...' : ''}&quot;
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {filters.map((filter, index) => (
                    <div
                      key={filter.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-md border border-slate-200"
                    >
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
                        {index + 1}
                      </div>

                      {/* Column Selector */}
                      <Select
                        value={filter.column}
                        onValueChange={value =>
                          updateFilter(index, { column: value })
                        }
                      >
                        <SelectTrigger className="h-8 w-32 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
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

                      {/* Operator Selector */}
                      <Select
                        value={filter.operator}
                        onValueChange={value =>
                          updateFilter(index, {
                            operator: value as FilterOperator,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-36 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getValidOperators(getColumnType(filter.column)).map(
                            operatorValue => (
                              <SelectItem
                                key={operatorValue}
                                value={operatorValue}
                              >
                                {OPERATOR_LABELS[operatorValue]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>

                      {/* Value Input - Hide for null checks */}
                      {filter.operator !== 'is_null' &&
                        filter.operator !== 'is_not_null' && (
                          <Input
                            type={getInputType(
                              filter.operator,
                              getColumnType(filter.column)
                            )}
                            placeholder={`Enter ${filter.operator === 'in' || filter.operator === 'not_in' ? 'comma-separated values' : 'value'}...`}
                            value={filter.value}
                            onChange={e => {
                              const validatedValue = validateInput(
                                e.target.value,
                                getColumnType(filter.column),
                                filter.operator
                              );
                              updateFilter(index, { value: validatedValue });
                            }}
                            className="h-8 flex-1 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                          />
                        )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFilter(index)}
                        className="h-8 w-8 p-0 border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAddFilterModal}
                  className="w-full h-8 border-dashed border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Filter
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Add Filter Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg border-slate-200 shadow-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Plus className="h-4 w-4" />
              </div>
              Add New Filter
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Column Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Column
              </label>
              <Select
                value={newFilter.column}
                onValueChange={value =>
                  setNewFilter(prev => ({ ...prev, column: value }))
                }
              >
                <SelectTrigger className="h-10 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map(column => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operator Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Operator
              </label>
              <Select
                value={newFilter.operator}
                onValueChange={value =>
                  setNewFilter(prev => ({
                    ...prev,
                    operator: value as FilterOperator,
                  }))
                }
              >
                <SelectTrigger className="h-10 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getValidOperators(getColumnType(newFilter.column)).map(
                    operatorValue => (
                      <SelectItem key={operatorValue} value={operatorValue}>
                        {OPERATOR_LABELS[operatorValue]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Value Input - Hide for null checks */}
            {newFilter.operator !== 'is_null' &&
              newFilter.operator !== 'is_not_null' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Value
                  </label>
                  <Input
                    type={getInputType(
                      newFilter.operator,
                      getColumnType(newFilter.column)
                    )}
                    placeholder={`Enter ${newFilter.operator === 'in' || newFilter.operator === 'not_in' ? 'comma-separated values' : 'value'}...`}
                    value={newFilter.value}
                    onChange={e => {
                      const validatedValue = validateInput(
                        e.target.value,
                        getColumnType(newFilter.column),
                        newFilter.operator
                      );
                      setNewFilter(prev => ({
                        ...prev,
                        value: validatedValue,
                      }));
                    }}
                    className="h-10 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                  />
                </div>
              )}
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button
              variant="outline"
              onClick={handleCancelAddFilter}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-700 transition-colors font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFilter}
              disabled={
                !newFilter.column ||
                (newFilter.operator !== 'is_null' &&
                  newFilter.operator !== 'is_not_null' &&
                  newFilter.value.trim() === '')
              }
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
