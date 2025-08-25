import { Suspense } from 'react';

import { User } from 'lucide-react';

import {
  Table,
  TableBody,
  TableHead as TableHeadBase,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { OverviewCard } from '../overview-card';

import { UserRows, LoadingUserRows } from './rows';

import { api } from '@/trpc/server';

import { cn } from '@/lib/utils';

interface Props {
  appId: string;
}

export const Users: React.FC<Props> = ({ appId }) => {
  const usersPromise = api.activity.app.users.list({
    echoAppId: appId,
    page_size: 5,
  });

  return (
    <OverviewCard
      title="Users"
      link={`/app/${appId}/users`}
      subtitle={usersPromise.then(users => `${users.total_count} total`)}
    >
      <Table className="mb-2">
        <TableHeader>
          <TableRow className="hover:bg-transparent text-xs">
            <TableHead className="pl-4 flex items-center gap-2">
              <div className="size-6 flex items-center justify-center bg-muted rounded-md">
                <User className="size-4" />
              </div>
              Name
            </TableHead>
            <TableHead className="text-center">Transactions</TableHead>
            <TableHead className="text-center">Cost</TableHead>
            <TableHead className="text-right pr-4">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Suspense fallback={<LoadingUserRows />}>
            <UserRows usersPromise={usersPromise.then(users => users.items)} />
          </Suspense>
        </TableBody>
      </Table>
    </OverviewCard>
  );
};

const TableHead = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <TableHeadBase
      className={cn('text-xs text-muted-foreground/60 h-fit pb-2', className)}
    >
      {children}
    </TableHeadBase>
  );
};
