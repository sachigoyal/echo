'use client';

import { Code, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';
import { UserAvatar } from '@/components/utils/user-avatar';

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
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{key.name}</p>
              <div className="flex items-center gap-1">
                <UserAvatar
                  className="size-4 border-none bg-transparent"
                  src={key.echoApp.profilePictureUrl}
                  fallback={<Code className="size-3" />}
                />
                <p className="text-xs text-muted-foreground">
                  {key.echoApp.name}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {key.createdAt.toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
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
