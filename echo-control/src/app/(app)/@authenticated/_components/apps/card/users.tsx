import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import { api } from '@/trpc/server';
import { UsersIcon } from 'lucide-react';

interface Props {
  appId: string;
}

export const Users: React.FC<Props> = ({ appId }) => {
  return (
    <div className="flex items-center gap-1 text-primary font-semibold">
      <UsersIcon className="size-3" />
      <Suspense fallback={<Skeleton className="size-4" />}>
        <UsersCount appId={appId} />
      </Suspense>
    </div>
  );
};

export const UsersCount = async ({ appId }: Props) => {
  const users = await api.apps.app.users.count({ appId });
  return <span className="text-sm">{users}</span>;
};
