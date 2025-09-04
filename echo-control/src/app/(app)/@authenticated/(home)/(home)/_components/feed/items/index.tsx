'use client';

import { api } from '@/trpc/client';
import { FeedItem, LoadingFeedItem } from './item';
import { Info, Loader2 } from 'lucide-react';
import { use } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  numAppsPromise: Promise<number>;
}

export const FeedItems: React.FC<Props> = ({ numAppsPromise }) => {
  const numApps = use(numAppsPromise);

  const [feed, { hasNextPage, fetchNextPage, isFetchingNextPage }] =
    api.user.feed.list.useSuspenseInfiniteQuery(
      {
        limit: 5,
      },
      {
        getNextPageParam: lastPage =>
          lastPage.has_next
            ? lastPage.items[lastPage.items.length - 1].timestamp
            : undefined,
      }
    );

  console.log(feed.pages);

  const rows = feed.pages.flatMap(page => page.items);

  if (rows.length === 0) {
    return (
      <div className="w-full flex gap-2 p-4 items-center">
        <Info className="size-5 text-muted-foreground" />
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">
            {numApps === 0 ? 'No Apps' : 'No Activity'}
          </h4>
          <p className="text-xs text-muted-foreground/60">
            {numApps === 0
              ? 'Your app activity will appear here when you create your first app'
              : 'No activity on your apps yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {rows.map((item, index) => (
        <FeedItem
          key={`${item.timestamp.toString()}-${index}`}
          activity={item}
        />
      ))}
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          variant="ghost"
          disabled={isFetchingNextPage}
          className="w-full h-fit py-1 text-xs text-muted-foreground/60 rounded-none"
        >
          {isFetchingNextPage ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Load more'
          )}
        </Button>
      )}
    </>
  );
};

export const LoadingFeedItems = () => {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingFeedItem key={index} />
      ))}
    </>
  );
};
