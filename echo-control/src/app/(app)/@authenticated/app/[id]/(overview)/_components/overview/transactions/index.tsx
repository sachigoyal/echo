import { Suspense } from 'react';

import { Activity } from 'lucide-react';

import {
  Table,
  TableBody,
  TableHead as TableHeadBase,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { OverviewCard } from '../overview-card';

import { TransactionRows, LoadingTransactionRows } from './rows';

import { cn } from '@/lib/utils';

interface Props {
  appId: string;
}

export const Transactions: React.FC<Props> = ({ appId }) => {
  return (
    <OverviewCard title="Transactions" link={`/app/${appId}/transactions`}>
      <Table className="mb-2">
        <TableHeader>
          <TableRow className="hover:bg-transparent text-xs">
            <TableHead className="pl-4 flex items-center gap-2">
              <div className="size-8 flex items-center justify-center bg-muted rounded-md">
                <Activity className="size-4" />
              </div>
              Activity
            </TableHead>
            <TableHead className="text-right pr-4">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <Suspense fallback={<LoadingTransactionRows />}>
            <TransactionRows appId={appId} />
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
