import { NonArrayFilterValue } from '../type/parameter';

// Convert filter value to appropriate type for numeric columns
export const convertValue = (
  value: NonArrayFilterValue,
  column: string,
  numericColumns: string[]
) => {
  if (numericColumns.includes(column)) {
    return Number(value);
  }
  return value;
};
