'use client';

import { Suspense } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

import { AppCard, LoadingAppCard } from './card';

import { api } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const MyApps = () => {
  return (
    <ErrorBoundary fallback={<div>There was an error loading your apps</div>}>
      <Suspense fallback={<LoadingApps />}>
        <Apps />
      </Suspense>
    </ErrorBoundary>
  );
};

export const LoadingApps = () => {
  return (
    <AppsContainer>
      {Array.from({ length: 3 }).map((_, i) => (
        <LoadingAppCard key={i} />
      ))}
    </AppsContainer>
  );
};

const Apps = () => {
  const [apps, { hasNextPage, fetchNextPage, isFetchingNextPage }] =
    api.apps.list.owner.useSuspenseInfiniteQuery(
      {
        page_size: 10,
      },
      {
        getNextPageParam: lastPage =>
          lastPage.has_next ? lastPage.page + 1 : undefined,
      }
    );

  return (
    <AppsContainer>
      {apps.pages
        .flatMap(page => page.items)
        .map(app => (
          <AppCard key={app.id} {...app} />
        ))}
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          variant="outline"
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            'Load more'
          )}
        </Button>
      )}
    </AppsContainer>
  );
};

const AppsContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col gap-4">{children}</div>;
};
