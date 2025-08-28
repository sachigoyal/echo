'use client';

import { Loader2, TicketPlus, User } from 'lucide-react';

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

import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/utils/user-avatar';
import { formatCurrency } from '@/lib/balance';
import { api } from '@/trpc/client';

interface Referral {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  referrer: {
    id: string;
    name: string | null;
    image: string | null;
  };
  totalSpent: number;
}

interface Pagination {
  hasNext: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

interface Props {
  appId: string;
}

export const ReferralsTable: React.FC<Props> = ({ appId }) => {
  const [
    referralMemberships,
    { hasNextPage, fetchNextPage, isFetchingNextPage },
  ] = api.apps.app.memberships.list.useSuspenseInfiniteQuery(
    { appId, referrerUserId: 'any' },
    {
      getNextPageParam: lastPage =>
        lastPage.has_next ? lastPage.page + 1 : undefined,
    }
  );
  const [referralReward] =
    api.apps.app.referralReward.get.useSuspenseQuery(appId);

  const rows = referralMemberships.pages.flatMap(page => page.items);

  return (
    <BaseReferralsTable
      pagination={
        hasNextPage
          ? {
              hasNext: hasNextPage,
              fetchNextPage,
              isFetchingNextPage,
            }
          : undefined
      }
    >
      {rows.length > 0 ? (
        <ReferralRows
          referrals={rows
            .filter(row => row.referrer?.user)
            .map(row => ({
              user: row.user,
              referrer: row.referrer!.user!,
              totalSpent: row.totalSpent,
            }))}
        />
      ) : (
        <TableEmpty colSpan={3}>
          {!referralReward
            ? 'You have not set a referral reward. Please set a referral reward to see referrals.'
            : 'No referrals yet.'}
        </TableEmpty>
      )}
    </BaseReferralsTable>
  );
};

export const LoadingReferralsTable = () => {
  return (
    <BaseReferralsTable>
      <LoadingUserRow />
      <LoadingUserRow />
    </BaseReferralsTable>
  );
};

const ReferralRows = ({ referrals }: { referrals: Referral[] }) => {
  return referrals.map(referral => (
    <ReferralRow key={referral.user.id} referral={referral} />
  ));
};

const ReferralRow = ({ referral }: { referral: Referral }) => {
  return (
    <TableRow key={referral.user.id}>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <UserAvatar src={referral.user.image} className="size-6" />
          <p className="text-sm font-medium">{referral.user.name}</p>
        </div>
      </TableCell>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <UserAvatar src={referral.referrer.image} className="size-6" />
          <p className="text-sm font-medium">{referral.referrer.name}</p>
        </div>
      </TableCell>
      <TableCell>{formatCurrency(referral.totalSpent)}</TableCell>
    </TableRow>
  );
};

const LoadingUserRow = () => {
  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="size-6" />
          <Skeleton className="h-4 w-16" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-row items-center gap-2">
          <Skeleton className="size-6" />
          <Skeleton className="h-4 w-16" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
    </TableRow>
  );
};

interface BaseReferralsTableProps {
  children: React.ReactNode;
  pagination?: Pagination;
}

const BaseReferralsTable = ({
  children,
  pagination,
}: BaseReferralsTableProps) => {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent text-xs">
            <TableHead className="pl-4 flex items-center gap-2">
              <div className="size-6 flex items-center justify-center bg-muted rounded-md">
                <User className="size-4" />
              </div>
              User
            </TableHead>
            <TableHead className="text-center">
              <div className="flex flex-row items-center gap-2">
                <div className="size-6 flex items-center justify-center bg-muted rounded-md">
                  <TicketPlus className="size-4" />
                </div>
                Referrer
              </div>
            </TableHead>
            <TableHead className="text-center">Total Spent</TableHead>
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
    </>
  );
};
