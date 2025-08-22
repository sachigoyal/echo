import {
  Table,
  TableBody,
  TableCell as TableCellBase,
  TableHead as TableHeadBase,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserAvatar } from '@/components/utils/user-avatar';
import { cn, formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/server';
import { User } from 'lucide-react';
import { OverviewCard } from '../overview-card';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
          <Suspense fallback={<LoadingUsersTable />}>
            <UsersTable
              usersPromise={usersPromise.then(users => users.items)}
            />
          </Suspense>
        </TableBody>
      </Table>
    </OverviewCard>
  );
};

const UsersTable = async ({
  usersPromise,
}: {
  usersPromise: Promise<
    Awaited<ReturnType<typeof api.activity.app.users.list>>['items']
  >;
}) => {
  const users = await usersPromise;

  return users.map(user => (
    <TableRow key={user.id}>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <UserAvatar src={user.image} className="size-6" />
          <p className="text-sm font-medium">{user.name}</p>
        </div>
      </TableCell>
      <TableCell>{user.usage.totalTransactions}</TableCell>
      <TableCell>{formatCurrency(user.usage.rawCost)}</TableCell>
      <TableCell className="text-right pr-4">
        {formatCurrency(user.usage.markupProfit)}
      </TableCell>
    </TableRow>
  ));
};

const LoadingUsersTable = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="size-6" />
          <Skeleton className="w-16 h-4" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="w-16 h-4 mx-auto" />
      </TableCell>
      <TableCell>
        <Skeleton className="w-16 h-4 mx-auto" />
      </TableCell>
      <TableCell className="pr-4">
        <Skeleton className="w-16 h-4 ml-auto" />
      </TableCell>
    </TableRow>
  ));
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

const TableCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <TableCellBase
      className={cn('text-center text-xs text-muted-foreground', className)}
    >
      {children}
    </TableCellBase>
  );
};
