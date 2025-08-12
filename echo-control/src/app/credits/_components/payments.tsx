'use client';

import { useState } from 'react';

import { api } from '@/trpc/client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';

import { formatCurrency } from '@/lib/balance';

export const Payments = () => {
  const [page, setPage] = useState(0);
  const [{ pages }] = api.user.payments.list.useSuspenseInfiniteQuery(
    {
      limit: 10,
    },
    {
      getNextPageParam(lastPage) {
        return lastPage.has_next ? lastPage.page + 1 : undefined;
      },
    }
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (pages[0].total_count === 0) {
    return (
      <div className="text-center py-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pages[0].total_count === 0 ? (
        <div className="text-center py-8 flex items-center justify-center h-full">
          <p className="text-muted-foreground">No credits purchased</p>
        </div>
      ) : (
        pages[page].items.map(payment => (
          <div
            key={payment.id}
            className="flex items-center justify-between gap-4"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {payment.description || 'Echo Credits Purchase'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(payment.createdAt)}
              </p>
            </div>
            <div className="text-right space-y-1 shrink-0">
              <p className="font-semibold text-sm">
                {formatCurrency(Number(payment.amount))}
              </p>
              <p
                className={`text-xs capitalize ${getStatusColor(payment.status)}`}
              >
                {payment.status}
              </p>
            </div>
          </div>
        ))
      )}

      {pages[0].has_next && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  setPage(prev => Math.max(prev - 1, 0));
                }}
              />
            </PaginationItem>
            {page > 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {Array.from({ length: 3 }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href="#" isActive>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            {page + 2 < pages[0].total_count && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  setPage(prev => prev + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
