import { UserAvatar } from '@/components/utils/user-avatar';

import { Code } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RouterOutputs } from '@/trpc/client';
import { cn } from '@/lib/utils';
import { Earnings, LoadingEarningsAmount } from './earnings';
import Link from 'next/link';

interface Props {
  app: RouterOutputs['apps']['list']['owner']['items'][number];
}

export const AppRow: React.FC<Props> = ({ app }) => {
  return (
    <Link
      href={`/app/${app.id}`}
      className="border-b last:border-b-0 hover:bg-muted/40 transition-colors"
    >
      <div className="p-2 flex justify-between items-center ">
        <div className="flex items-center gap-2">
          <UserAvatar
            src={app.profilePictureUrl}
            fallback={<Code className="size-4" />}
            className="size-8"
          />
          <div>
            <p className="font-bold text-foreground leading-tight">
              {app.name}
            </p>
            <p
              className={cn(
                'text-xs leading-tight',
                app.homepageUrl
                  ? 'text-muted-foreground/80'
                  : 'text-muted-foreground/40'
              )}
            >
              {app.homepageUrl ?? 'No homepage URL'}
            </p>
          </div>
        </div>
        <Earnings appId={app.id} />
      </div>
    </Link>
  );
};

export const LoadingAppRow = () => {
  return (
    <div className="border-b last:border-b-0 p-2 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Skeleton className="size-6" />
        <div>
          <Skeleton className="w-32 h-4 my-0.5" />
          <Skeleton className="w-48 h-[14px] my-[3px]" />
        </div>
      </div>
      <LoadingEarningsAmount />
    </div>
  );
};
