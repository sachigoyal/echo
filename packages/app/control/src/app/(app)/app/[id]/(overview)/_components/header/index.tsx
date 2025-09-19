'use client';

import React, { Suspense } from 'react';

import { Code } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { UserAvatar } from '@/components/utils/user-avatar';

import { OverallAppStats, LoadingOverallAppStats } from './stats';

import { cn } from '@/lib/utils';

import { api } from '@/trpc/client';
import { HeaderButtons, LoadingHeaderButtons } from './buttons';

interface Props {
  appId: string;
}

export const HeaderCard: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId });

  return (
    <Card className={cn('relative mt-10 md:mt-12 mb-12')}>
      <div className="absolute top-0 left-4 -translate-y-1/2 size-16 md:size-20 flex items-center justify-center">
        <UserAvatar
          src={app.profilePictureUrl ?? undefined}
          className="size-full"
          fallback={<Code className="size-8" />}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-12 md:pt-14 col-span-5">
          <div className="">
            <h1 className="text-3xl font-bold break-words line-clamp-2">
              {app.name}
            </h1>
            <p
              className={cn(
                'break-words line-clamp-2',
                app.description
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/40'
              )}
            >
              {app.description ?? 'No description'}
            </p>
          </div>
          <Suspense fallback={<LoadingHeaderButtons />}>
            <HeaderButtons appId={appId} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<LoadingOverallAppStats />}>
            <OverallAppStats appId={appId} />
          </Suspense>
        </div>
      </div>
    </Card>
  );
};

export const LoadingHeaderCard = () => {
  return (
    <Card className={cn('relative mt-10 md:mt-12 mb-12')}>
      <div className="absolute top-0 left-4 -translate-y-1/2 size-16 md:size-20 flex items-center justify-center">
        <UserAvatar
          src={undefined}
          className="size-full"
          fallback={<Code className="size-8" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-12 md:pt-14 col-span-5">
          <div className="">
            <Skeleton className="w-36 h-[30px] my-[3px]" />
            <Skeleton className="w-64 h-[16px] my-[4px]" />
          </div>
          <LoadingHeaderButtons />
        </div>
        <div className="col-span-2 overflow-hidden">
          <LoadingOverallAppStats />
        </div>
      </div>
    </Card>
  );
};
