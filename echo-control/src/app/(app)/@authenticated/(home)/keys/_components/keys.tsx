'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';

export const Keys = () => {
  const [{ pages }, { fetchNextPage, isFetchingNextPage }] =
    api.user.apiKeys.list.useSuspenseInfiniteQuery(
      {},
      {
        getNextPageParam(lastPage) {
          return lastPage.has_next ? lastPage.page + 1 : undefined;
        },
      }
    );

  if (pages[0].total_count === 0) {
    return (
      <div className="text-center py-8 flex items-center justify-center h-full">
        <p className="text-muted-foreground">No keys found</p>
      </div>
    );
  }

  const flatPages = pages.flatMap(page => page.items);

  return (
    <div className="flex flex-col gap-4">
      {pages[0].total_count === 0 ? (
        <div className="text-center py-8 flex items-center justify-center h-full">
          <p className="text-muted-foreground">No keys found</p>
        </div>
      ) : (
        flatPages.map(key => (
          <div key={key.id} className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{key.name}</p>
              <p className="text-xs text-muted-foreground">
                {key.createdAt.toLocaleString()}
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
