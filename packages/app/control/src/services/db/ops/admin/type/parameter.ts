import type { FilterValue } from '@/services/db/lib/filtering';

// Values allowed as SQL query parameters
export type SQLParameter = string | number | boolean | Date | null;
// Non-array filter values (used where arrays are spread for IN/NOT IN)
export type NonArrayFilterValue = Exclude<FilterValue, (string | number)[]>;
