import React from 'react';

import Link from 'next/link';

import { LucideIcon } from 'lucide-react';

import { UserAvatar } from '@/components/utils/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Route } from 'next';

interface Props<T extends string> {
  href: Route<T>;
  image: string | null;
  name: string;
  Fallback: LucideIcon;
}

export const Breadcrumb = <T extends string>({
  href,
  image,
  name,
  Fallback,
}: Props<T>) => {
  return (
    <Link href={href}>
      <div className="flex items-center gap-2 cursor-pointer">
        <UserAvatar
          src={image ?? undefined}
          fallback={<Fallback className="size-3" />}
          className="size-5"
        />
        <p className="font-semibold text-sm">{name}</p>
      </div>
    </Link>
  );
};

export const LoadingBreadcrumb = () => {
  return (
    <div className="flex items-center gap-2 cursor-pointer">
      <Skeleton className="size-5" />
      <Skeleton className="w-10 h-[14px]" />
    </div>
  );
};
