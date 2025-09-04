import { api, HydrateClient } from '@/trpc/server';
import { FeedItems, LoadingFeedItems } from './items';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';

interface Props {
  numAppsPromise: Promise<number>;
}

export const Feed: React.FC<Props> = ({ numAppsPromise }) => {
  api.user.feed.list.prefetchInfinite({
    cursor: new Date(),
    limit: 5,
    numHours: 4,
  });

  return (
    <HydrateClient>
      <FeedContainer>
        <Suspense fallback={<LoadingFeedItems />}>
          <FeedItems numAppsPromise={numAppsPromise} />
        </Suspense>
      </FeedContainer>
    </HydrateClient>
  );
};

export const LoadingFeed = () => {
  return (
    <FeedContainer>
      <LoadingFeedItems />
    </FeedContainer>
  );
};

const FeedContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full flex flex-col gap-2 md:gap-3 pb-2">
      <div className="flex justify-between items-center">
        <h3 className="font-bold">Activity Feed</h3>
      </div>
      <Card className="p-0 overflow-hidden relative">{children}</Card>
    </div>
  );
};
