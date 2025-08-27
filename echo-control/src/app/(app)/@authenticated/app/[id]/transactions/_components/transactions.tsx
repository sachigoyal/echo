'use client';

import React from 'react';

import {
  TableRow,
  TableCell as TableCellBase,
  TableFooter,
  TableBody,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

import { UserAvatar } from '@/components/utils/user-avatar';

import { formatCurrency } from '@/lib/utils';

import { api } from '@/trpc/client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  appId: string;
}

export const TransactionRows: React.FC<Props> = ({ appId }) => {
  const [transactions, { hasNextPage, fetchNextPage, isFetchingNextPage }] =
    api.apps.app.transactions.list.useSuspenseInfiniteQuery(
      { appId, page_size: 200 },
      {
        getNextPageParam: lastPage =>
          lastPage.has_next ? lastPage.page + 1 : undefined,
      }
    );

  const rows = transactions.pages.flatMap(page => page.items);

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow className="mt-2">
          <TableCellBase colSpan={4} className="text-left pl-4">
            <p className="text-xs text-muted-foreground/60">
              No transactions yet
            </p>
          </TableCellBase>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <>
      <TableBody>
        {rows.map(transaction => (
          <TableRow key={transaction.id}>
            <TableCell className="pl-4">
              <div className="flex flex-row items-center gap-2">
                <UserAvatar src={transaction.user.image} className="size-8" />
                <div className="flex flex-col items-start">
                  <p className="text-sm leading-tight">
                    <span className="font-medium">{transaction.user.name}</span>{' '}
                    made {transaction.callCount} requests
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(transaction.date, {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right pr-4 text-primary font-bold">
              {formatCurrency(transaction.appProfit)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {hasNextPage && (
        <TableFooter className="bg-transparent hover:bg-transparent">
          <TableRow>
            <TableCellBase colSpan={4} className="text-center p-0">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="ghost"
                className="w-full text-muted-foreground/60 rounded-none"
                size="sm"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </Button>
            </TableCellBase>
          </TableRow>
        </TableFooter>
      )}
    </>
  );
};

export const LoadingTransactionRows = () => {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="pl-4">
            <div className="flex flex-row items-center gap-2">
              <Skeleton className="size-6" />
              <Skeleton className="w-32 h-4" />
            </div>
          </TableCell>
          <TableCell className="pr-4">
            <Skeleton className="w-16 h-4 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};

const TableCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <TableCellBase
      className={cn('text-center text-xs text-muted-foreground', className)}
    >
      {children}
    </TableCellBase>
  );
};
