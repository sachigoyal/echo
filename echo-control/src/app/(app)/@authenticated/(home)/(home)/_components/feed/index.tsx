import { HydrateClient } from '@/trpc/server';
import { FeedItems, LoadingFeedItems } from './items';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { RouterOutputs } from '@/trpc/client';

interface Props {
  numAppsPromise: Promise<number>;
  feedPromise: Promise<RouterOutputs['user']['feed']['list']>;
}

export const Feed: React.FC<Props> = ({ numAppsPromise, feedPromise }) => {
  return (
    <HydrateClient>
      <FeedContainer>
        <Suspense fallback={<LoadingFeedItems />}>
          <FeedItems
            numAppsPromise={numAppsPromise}
            feedPromise={feedPromise}
          />
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
