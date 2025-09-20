import type { ColumnFiltersState } from '@tanstack/react-table';
import z from 'zod';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | (string | number)[];

export type FilterParams = {
  filters?: Array<{
    column: string;
    operator: FilterOperator;
    value?: FilterValue;
  }>;
};

// Zod schema for filter parameters
export const filterParamsSchema = z.object({
  filters: z
    .array(
      z.object({
        column: z.string(),
        operator: z.enum([
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
        ]),
        value: z
          .union([
            z.string(),
            z.number(),
            z.boolean(),
            z.date(),
            z.array(z.union([z.string(), z.number()])),
          ])
          .optional(),
      })
    )
    .optional(),
});

// Convert TanStack Table ColumnFiltersState to our standardized filter params
export const toFilterParams = (
  columnFilters: ColumnFiltersState
): FilterParams => {
  if (!columnFilters.length) return {};

  return {
    filters: columnFilters.map(filter => {
      // Parse structured filter value: "operator:value" or just "operator" for null checks
      const filterValue = String(filter.value || '');
      const [operator, ...valueParts] = filterValue.split(':');
      const value = valueParts.join(':'); // Rejoin in case value contains colons

      return {
        column: filter.id,
        operator: (operator as FilterOperator) || 'contains',
        value: value || undefined,
      };
    }),
  };
};
