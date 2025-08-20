import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/utils/user-avatar';
import { Code } from 'lucide-react';
import Link from 'next/link';

interface Props {
  id: string;
  name: string;
  description: string | null;
  profilePictureUrl: string | null;
}

export const AppCard = ({
  id,
  name,
  description,
  profilePictureUrl,
}: Props) => {
  return (
    <Link href={`/app/${id}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserAvatar
              className="size-4 border-none bg-transparent"
              src={profilePictureUrl ?? undefined}
              fallback={<Code className="size-3" />}
            />
            <CardTitle className="truncate">{name}</CardTitle>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
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
