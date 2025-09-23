'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';

export interface CollapsibleTableColumn<TData> {
  id: string;
  header: React.ReactNode;
  cell: (row: TData) => React.ReactNode;
  className?: string;
}

interface InnerTableDefinition<TInnerData> {
  columns: CollapsibleTableColumn<TInnerData>[];
  rows: TInnerData[];
}

interface CollapsibleTableItem<TData, TInnerData = never> {
  id?: string;
  row: TData;
  innerTable?: InnerTableDefinition<TInnerData>;
  defaultOpen?: boolean;
}

interface CollapsibleTableProps<TData, TInnerData = never> {
  title?: string;
  columns: CollapsibleTableColumn<TData>[];
  items: CollapsibleTableItem<TData, TInnerData>[];
  getRowId?: (row: TData, index: number) => string;
  emptyState?: React.ReactNode;
  includeLeadingExpandColumn?: boolean;
  renderTrigger?: (open: boolean) => React.ReactNode;
}

// Swallows props from Radix asChild to avoid applying them to a Fragment
function CollapsibleRows({
  children,
  ..._ignored
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

function InnerTable<TInnerData>({
  definition,
}: {
  definition: InnerTableDefinition<TInnerData> | undefined;
}) {
  if (!definition || definition.rows.length === 0) return null;

  const { rows, columns } = definition;

  return (
    <Table>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map(col => (
              <TableCell key={`${index}-${col.id}`} className={col.className}>
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CollapsibleTable<TData, TInnerData = never>({
  title,
  columns,
  items,
  getRowId,
  emptyState = 'No results.',
  includeLeadingExpandColumn = true,
  renderTrigger: _renderTrigger,
}: CollapsibleTableProps<TData, TInnerData>) {
  const getId = React.useCallback(
    (row: TData, index: number) =>
      getRowId ? getRowId(row, index) : String(index),
    [getRowId]
  );

  const hasAnyInnerTable = React.useMemo(
    () => items.some(item => Boolean(item.innerTable)),
    [items]
  );

  const showExpandColumn = includeLeadingExpandColumn && hasAnyInnerTable;
  const headerColSpan = columns.length + (showExpandColumn ? 1 : 0);

  return (
    <div className="w-full">
      {title ? (
        <div className="px-4 py-3">
          <h2 className="text-sm font-medium text-slate-700">{title}</h2>
        </div>
      ) : null}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {showExpandColumn ? (
                <TableHead className="w-8 min-w-8 max-w-8" />
              ) : null}
              {columns.map(col => (
                <TableHead key={col.id} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headerColSpan} className="h-24 text-center">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const row = item.row;
                const id = item.id ?? getId(row, index);
                const hasInner = Boolean(item.innerTable);
                if (!hasInner) {
                  return (
                    <TableRow key={id}>
                      {showExpandColumn ? (
                        <TableCell className="w-8 min-w-8 max-w-8" />
                      ) : null}
                      {columns.map(col => (
                        <TableCell
                          key={`${id}-${col.id}`}
                          className={col.className}
                        >
                          {col.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                }

                return (
                  <Collapsible key={id} asChild defaultOpen={item.defaultOpen}>
                    <CollapsibleRows>
                      <TableRow>
                        {showExpandColumn ? (
                          <TableCell className="w-8 min-w-8 max-w-8">
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="h-6 w-6 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 transition-colors data-[state=open]:rotate-90"
                                aria-label="Toggle row"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </CollapsibleTrigger>
                          </TableCell>
                        ) : null}
                        {columns.map(col => (
                          <TableCell
                            key={`${id}-${col.id}`}
                            className={col.className}
                          >
                            {col.cell(row)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={headerColSpan}>
                            <InnerTable definition={item.innerTable} />
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </CollapsibleRows>
                  </Collapsible>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
