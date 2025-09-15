import { SortingState } from "@tanstack/react-table";
import z from 'zod';

export type SortDirection = "asc" | "desc";

export type SortParams = {
  sort_by?: string;
  sort_direction?: SortDirection;
};

export type MultiSortParams = {
  sorts?: Array<{
    column: string;
    direction: SortDirection;
  }>;
};

// Zod schema for multi-sort parameters
export const multiSortParamsSchema = z.object({
  sorts: z.array(z.object({
    column: z.string(),
    direction: z.enum(["asc", "desc"]),
  })).optional(),
});

// Convert TanStack Table SortingState to multi-sort params
export const toMultiSortParams = (sorting: SortingState): MultiSortParams => {
  return {
    sorts: sorting.map(sort => ({
      column: sort.id,
      direction: sort.desc ? "desc" : "asc",
    })),
  };
};