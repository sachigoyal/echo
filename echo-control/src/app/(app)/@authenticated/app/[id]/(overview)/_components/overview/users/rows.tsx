import { api } from '@/trpc/server';
import { formatCurrency } from '@/lib/utils';
import { TableRow, TableCell as TableCellBase } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/utils/user-avatar';

export const UserRows = async ({
  usersPromise,
}: {
  usersPromise: Promise<
    Awaited<ReturnType<typeof api.apps.app.users.list>>['items']
  >;
}) => {
  const users = await usersPromise;

  if (users.length === 0) {
    return (
      <TableRow className="mt-2">
        <TableCellBase colSpan={4} className="text-left pl-4">
          <p className="text-xs text-muted-foreground/60">No users yet</p>
        </TableCellBase>
      </TableRow>
    );
  }

  return users.map(user => (
    <TableRow key={user.id}>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <UserAvatar src={user.image} className="size-8" />
          <p className="text-sm font-medium">{user.name}</p>
        </div>
      </TableCell>
      <TableCell>{user.usage.totalTransactions}</TableCell>
      <TableCell>
        {formatCurrency(user.usage.rawCost - user.usage.markupProfit)}
      </TableCell>
      <TableCell className="text-right pr-4 text-primary font-bold">
        {formatCurrency(user.usage.markupProfit)}
      </TableCell>
    </TableRow>
  ));
};

export const LoadingUserRows = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="size-8" />
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
