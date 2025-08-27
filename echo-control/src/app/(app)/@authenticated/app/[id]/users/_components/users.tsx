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

interface Props {
  appId: string;
}

export const UserRows: React.FC<Props> = ({ appId }) => {
  const [users, { hasNextPage, fetchNextPage, isFetchingNextPage }] =
    api.apps.app.users.list.useSuspenseInfiniteQuery(
      { appId },
      {
        getNextPageParam: lastPage =>
          lastPage.has_next ? lastPage.page + 1 : undefined,
      }
    );

  const rows = users.pages.flatMap(page => page.items);

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow className="mt-2">
          <TableCellBase colSpan={4} className="text-left pl-4">
            <p className="text-xs text-muted-foreground/60">No users yet</p>
          </TableCellBase>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <>
      <TableBody>
        {rows.map(user => (
          <TableRow key={user.id}>
            <TableCell className="pl-4">
              <div className="flex flex-row items-center gap-2">
                <UserAvatar src={user.image} className="size-6" />
                <p className="text-sm font-medium">{user.name}</p>
              </div>
            </TableCell>
            <TableCell>{user.usage.totalTransactions}</TableCell>
            <TableCell>{formatCurrency(user.usage.rawCost)}</TableCell>
            <TableCell className="text-right pr-4 text-primary font-bold">
              {formatCurrency(user.usage.markupProfit)}
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

export const LoadingUserRows = () => {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="pl-4">
            <div className="flex flex-row items-center gap-2">
              <Skeleton className="size-6" />
              <Skeleton className="w-16 h-4" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="w-16 h-4 mx-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="w-16 h-4 mx-auto" />
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
