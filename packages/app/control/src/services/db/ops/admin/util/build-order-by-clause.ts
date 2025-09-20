import type { MultiSortParams } from '@/services/db/lib/sorting';

type OrderByColumnMappings = Record<string, string>;

type BuildOrderByOptions = {
  columnMappings: OrderByColumnMappings;
  // Example: p."createdAt" DESC
  defaultOrderClause: string;
  // If provided, explicitly treat these column ids as aggregated (i.e., use their SELECT aliases)
  aggregatedColumnIds?: string[];
};

export const buildOrderByClause = (
  sorts: MultiSortParams['sorts'] | undefined,
  options: BuildOrderByOptions
): string => {
  const { columnMappings, defaultOrderClause, aggregatedColumnIds } = options;

  if (!sorts || sorts.length === 0) {
    return `ORDER BY ${defaultOrderClause}`;
  }

  const orderClauses = sorts.map(sort => {
    const sqlColumn = columnMappings[sort.column];
    if (!sqlColumn) {
      throw new Error(`Invalid sort column: ${sort.column}`);
    }

    let isAggregated = false;
    if (aggregatedColumnIds && aggregatedColumnIds.length > 0) {
      isAggregated = aggregatedColumnIds.includes(sort.column);
    } else {
      const upperSql = sqlColumn.toUpperCase();
      isAggregated =
        upperSql.includes('SUM(') ||
        upperSql.includes('COUNT(') ||
        upperSql.includes('COALESCE(') ||
        upperSql.includes('MAX(') ||
        upperSql.includes('MIN(') ||
        upperSql.includes('AVG(');
    }

    const orderColumn = isAggregated ? `"${sort.column}"` : sqlColumn;
    const direction = (sort.direction || 'asc').toUpperCase();
    return `${orderColumn} ${direction}`;
  });

  return `ORDER BY ${orderClauses.join(', ')}`;
};
