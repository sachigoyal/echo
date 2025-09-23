'use client';

import { Loader2, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableRow,
  TableHead,
  TableHeader,
  TableBody,
  TableCell,
  TableEmpty,
} from '@/components/ui/table';

import { api } from '@/trpc/client';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserAvatar } from '@/components/utils/user-avatar';
import { formatCurrency } from '@/lib/utils';

interface Pagination {
  hasNext: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

interface Props {
  code: string;
}

export const CreditGrantUsersTable: React.FC<Props> = ({ code }) => {
  const [users, { hasNextPage, fetchNextPage, isFetchingNextPage }] =
    api.admin.creditGrants.grant.listUsers.useSuspenseInfiniteQuery(
      { code },
      {
        getNextPageParam(lastPage) {
          return lastPage.has_next ? lastPage.page + 1 : undefined;
        },
      }
    );

  return (
    <BaseCreditGrantUsersTable
      pagination={{
        hasNext: hasNextPage,
        fetchNextPage: () => void fetchNextPage(),
        isFetchingNextPage,
      }}
    >
      {users.pages.flatMap(page => page.items).length > 0 ? (
        users.pages
          .flatMap(page => page.items)
          .map(user => (
            <TableRow key={user.id}>
              <TableCell className="pl-4 font-bold">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={user.image}
                    fallback={<User className="size-3" />}
                    className="size-6"
                  />
                  <span className="text-sm font-bold">{user.name}</span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.creditGrantCodeUsages.length}</TableCell>
              <TableCell>
                {formatCurrency(
                  user.creditGrantCodeUsages.reduce(
                    (acc, usage) => acc + usage.grantedAmount,
                    0
                  )
                )}
              </TableCell>
            </TableRow>
          ))
      ) : (
        <TableEmpty colSpan={4}>
          Nobody has claimed this credit grant yet
        </TableEmpty>
      )}
    </BaseCreditGrantUsersTable>
  );
};

interface BaseCreditGrantUsersTableProps {
  children: React.ReactNode;
  pagination?: Pagination;
}

const BaseCreditGrantUsersTable: React.FC<BaseCreditGrantUsersTableProps> = ({
  children,
  pagination,
}: BaseCreditGrantUsersTableProps) => {
  return (
    <Card className="bg-transparent">
      <CardHeader>
        <CardTitle>Credit Grant Users</CardTitle>
        <CardDescription>
          These users have claimed this credit grant
        </CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead># of Uses</TableHead>
            <TableHead>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
      {pagination?.hasNext && (
        <div className="flex justify-center">
          <Button
            onClick={pagination.fetchNextPage}
            className="w-full"
            variant="ghost"
            disabled={pagination.isFetchingNextPage}
            size="sm"
          >
            {pagination.isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};
