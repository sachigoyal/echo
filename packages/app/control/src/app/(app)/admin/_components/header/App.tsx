'use client';

import React from 'react';

import { AppWindow as AppIcon } from 'lucide-react';

import { api } from '@/trpc/client';
import { UserAvatar } from '@/components/utils/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  appId: string;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ appId, className }) => {
  const { data, isLoading, isError } = api.admin.app.getApp.useQuery({ appId });

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-6 border rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-md" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-6 border rounded-lg p-4',
          className
        )}
      >
        <div className="flex items-center gap-4">
          <UserAvatar
            src={undefined}
            className="size-16"
            fallback={<AppIcon className="size-6" />}
          />
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">App not found</h2>
            <p className="text-sm text-muted-foreground">
              Unable to load app information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const name = data.name ?? 'Untitled App';
  const description = data.description ?? '';
  const createdDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString()
    : undefined;
  const owner = data.appMemberships?.[0]?.user;
  const ownerName = owner?.name ?? owner?.email ?? undefined;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 border rounded-lg p-4 mb-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <UserAvatar
          src={data.profilePictureUrl}
          className="size-16"
          fallback={<AppIcon className="size-6" />}
        />
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold leading-tight">{name}</h2>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {description}
            </p>
          )}
          {createdDate && (
            <p className="text-xs text-muted-foreground">
              Created {createdDate}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="text-sm text-muted-foreground">Owner</span>
        <span className="text-base font-medium">{ownerName ?? '—'}</span>
      </div>
    </div>
  );
};

export default AppHeader;
