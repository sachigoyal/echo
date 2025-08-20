'use client';

import React from 'react';

import { KeysList } from '../../../../_components/keys/list';

import { api } from '@/trpc/client';

interface Props {
  appId: string;
}

export const Keys = ({ appId }: Props) => {
  const [{ pages }, { fetchNextPage, isFetchingNextPage }] =
    api.user.apiKeys.list.useSuspenseInfiniteQuery(
      { appId },
      {
        getNextPageParam(lastPage) {
          return lastPage.has_next ? lastPage.page + 1 : undefined;
        },
      }
    );

  const keys = pages.flatMap(page => page.items);

  return (
    <KeysList
      keys={keys}
      hasNext={pages[pages.length - 1].has_next}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
};
