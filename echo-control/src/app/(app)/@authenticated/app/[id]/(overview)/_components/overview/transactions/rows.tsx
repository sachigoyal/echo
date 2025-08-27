import { api } from '@/trpc/server';
import { formatCurrency } from '@/lib/utils';
import { TableRow, TableCell as TableCellBase } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/utils/user-avatar';
import { formatDistanceToNow } from 'date-fns';

export const TransactionRows = async ({ appId }: { appId: string }) => {
  const transactions = await api.apps.app.transactions.list({
    appId,
    page_size: 1000,
  });

  if (transactions.length === 0) {
    return (
      <TableRow className="mt-2">
        <TableCellBase colSpan={2} className="text-left pl-4">
          <p className="text-xs text-muted-foreground/60">
            No transactions yet
          </p>
        </TableCellBase>
      </TableRow>
    );
  }

  return transactions.slice(0, 5).map(transaction => (
    <TableRow key={transaction.id}>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <UserAvatar src={transaction.user.image} className="size-6" />
          <p className="text-sm">
            <span className="font-medium">{transaction.user.name}</span> made{' '}
            {transaction.callCount} requests{' '}
            {formatDistanceToNow(transaction.date, {
              addSuffix: true,
            })}{' '}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right pr-4 text-primary font-bold">
        {formatCurrency(transaction.appProfit)}
      </TableCell>
    </TableRow>
  ));
};

export const LoadingTransactionRows = () => {
  return Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="size-6" />
          <Skeleton className="w-32 h-4" />
        </div>
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
