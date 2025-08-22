import {
  Table,
  TableBody,
  TableCell,
  TableHead as TableHeadBase,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserAvatar } from '@/components/utils/user-avatar';
import { cn, formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/server';
import { User } from 'lucide-react';

interface Props {
  appId: string;
}

export const Users: React.FC<Props> = async ({ appId }) => {
  const users = await api.activity.app.users.list({
    echoAppId: appId,
    page_size: 5,
  });

  return (
    <Table>
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
        {users.items.map(user => (
          <TableRow key={user.id}>
            <TableCell className="pl-4">
              <div className="flex flex-row items-center gap-2">
                <UserAvatar src={user.image} className="size-6" />
                <p className="text-sm font-medium">{user.name}</p>
              </div>
            </TableCell>
            <TableCell className="text-center text-xs text-muted-foreground">
              {user.usage.totalTransactions}
            </TableCell>
            <TableCell className="text-center text-xs text-muted-foreground">
              {formatCurrency(user.usage.rawCost)}
            </TableCell>
            <TableCell className="text-right pr-4 text-xs text-primary font-bold">
              {formatCurrency(user.usage.markupProfit)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
