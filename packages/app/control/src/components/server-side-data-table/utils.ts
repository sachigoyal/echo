import { TypedColumnDef } from './BaseTable';
import { ColumnType } from './FilterControls';

// Utility function to extract column name from column definition
function getColumnName<TData, TValue>(
  col: TypedColumnDef<TData, TValue>
): string | null {
  if ('accessorKey' in col && typeof col.accessorKey === 'string') {
    return col.accessorKey;
  }
  if ('id' in col && typeof col.id === 'string') {
    return col.id;
  }
  return null;
}

// Utility function to get sortable column names
export function getSortableColumns<TData, TValue>(
  columns: TypedColumnDef<TData, TValue>[]
): string[] {
  return columns
    .filter(col => col.enableSorting !== false)
    .map(getColumnName)
    .filter((name): name is string => name !== null);
}

// Utility function to get filterable column configs
// By default, all columns are filterable unless explicitly disabled
export function getFilterableColumnConfigs<TData, TValue>(
  columns: TypedColumnDef<TData, TValue>[]
): Array<{ name: string; type: ColumnType }> {
  return columns
    .filter(col => col.enableColumnFilter !== false)
    .map(col => {
      const name = getColumnName(col);
      return name ? { name, type: col.columnType } : null;
    })
    .filter(
      (config): config is { name: string; type: ColumnType } => config !== null
    );
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  if (typeof value === 'bigint') return Number(value);
  return 0;
}
