import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/utils/user-avatar';
import { Code } from 'lucide-react';
import Link from 'next/link';
import { GithubLink } from './github-link';
import { cn } from '@/lib/utils';
import { Users } from './users';
import { Earnings } from './earnings';

interface Props {
  id: string;
  name: string;
  description: string | null;
  profilePictureUrl: string | null;
  homepageUrl: string | null;
}

export const AppCard = ({
  id,
  name,
  description,
  profilePictureUrl,
  homepageUrl,
}: Props) => {
  return (
    <Link href={`/app/${id}`}>
      <Card className="hover:border-primary/50 transition-colors h-full">
        <CardHeader className="flex flex-row items-start gap-2 w-full overflow-hidden">
          <UserAvatar
            className="size-10 shrink-0"
            src={profilePictureUrl ?? undefined}
            fallback={<Code className="size-4" />}
          />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <CardTitle className="text-ellipsis whitespace-nowrap overflow-x-hidden">
              {name}
            </CardTitle>
            <CardDescription
              className={cn(
                'text-xs text-muted-foreground/60',
                homepageUrl
                  ? 'underline text-foreground/80'
                  : 'text-foreground/40'
              )}
            >
              {homepageUrl ?? 'No homepage URL'}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Earnings appId={id} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p
            className={cn(
              'text-sm text-muted-foreground/60',
              !description && 'text-muted-foreground/40'
            )}
          >
            {description ?? 'No description'}
          </p>
          <div className="flex items-center gap-2 justify-between">
            <Users appId={id} />
            <GithubLink appId={id} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const AppCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="w-24 h-4" />
        </div>
      </CardHeader>
    </Card>
  );
};
