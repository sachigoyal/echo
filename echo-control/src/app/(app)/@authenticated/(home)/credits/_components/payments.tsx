'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';

import { formatCurrency } from '@/lib/balance';

export const Payments = () => {
  const [{ pages }, { fetchNextPage, isFetchingNextPage }] =
    api.user.payments.list.useSuspenseInfiniteQuery(
      {},
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

  const flatPages = pages.flatMap(page => page.items);

  return (
    <div className="flex flex-col gap-4">
      {pages[0].total_count === 0 ? (
        <div className="text-center py-8 flex items-center justify-center h-full">
          <p className="text-muted-foreground">No credits purchased</p>
        </div>
      ) : (
        flatPages.map(payment => (
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

      {pages[pages.length - 1].has_next && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              fetchNextPage();
            }}
            className="w-full"
            variant="ghost"
            disabled={isFetchingNextPage}
            size="sm"
          >
            {isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
