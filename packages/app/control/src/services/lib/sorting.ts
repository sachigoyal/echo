import { SortingState } from "@tanstack/react-table";

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

// Convert TanStack Table SortingState to multi-sort params
export const toMultiSortParams = (sorting: SortingState): MultiSortParams => {
  return {
    sorts: sorting.map(sort => ({
      column: sort.id,
      direction: sort.desc ? "desc" : "asc",
    })),
  };
};