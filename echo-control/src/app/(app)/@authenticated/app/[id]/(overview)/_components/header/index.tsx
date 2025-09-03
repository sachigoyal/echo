'use client';

import React from 'react';

import Link from 'next/link';

import { ArrowUpRight, Code, Plus } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { UserAvatar } from '@/components/utils/user-avatar';

import { OverallAppStats, LoadingOverallAppStats } from './stats';
import { VisibilityButton } from './visibility-button';

import { cn } from '@/lib/utils';

import { api } from '@/trpc/client';

interface Props {
  appId: string;
}

export const HeaderCard: React.FC<Props> = ({ appId }) => {
  const [app] = api.apps.app.get.useSuspenseQuery({ appId: appId });
  const [isOwner] = api.apps.app.isOwner.useSuspenseQuery(appId);

  return (
    <Card className={cn('relative mt-10 md:mt-12 mb-12')}>
      <UserAvatar
        src={app.profilePictureUrl ?? undefined}
        className="size-16 md:size-20 absolute top-0 left-4 -translate-y-1/2 bg-card border border-border/60"
        fallback={<Code className="size-8" />}
      />
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-12 md:pt-14 col-span-5">
          <div className="">
            <h1 className="text-3xl font-bold">{app.name}</h1>
            <p className="text-muted-foreground">{app.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {app.homepageUrl ? (
              <a href={app.homepageUrl} target="_blank">
                <ArrowUpRight className="size-4" />
                Use App
              </a>
            ) : isOwner ? (
              <Link href={`/app/${appId}/settings/general`}>
                <Button>
                  <Plus className="size-4" />
                  Add Homepage
                </Button>
              </Link>
            ) : (
              <Button variant="outline" disabled>
                No App Url
              </Button>
            )}
            {isOwner && <VisibilityButton appId={appId} />}
          </div>
        </div>
        <div className="col-span-2">
          <OverallAppStats appId={appId} />
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
          className="size-16 md:size-20"
          fallback={<Code className="size-8" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-12 md:pt-14 col-span-5">
          <div className="">
            <Skeleton className="w-36 h-[30px] my-[3px]" />
            <Skeleton className="w-64 h-[16px] my-[4px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-24 h-9" />
          </div>
        </div>
        <div className="col-span-2">
          <LoadingOverallAppStats />
        </div>
      </div>
    </Card>
  );
};
