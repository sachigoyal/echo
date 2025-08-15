'use client';
import { formatCurrency } from '@/lib/balance';
import { api } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';

export const Balance = () => {
  const { isAuthenticated, isLoaded } = useUser();

  const { data: balance, isLoading } = api.user.balance.get.useQuery(
    undefined,
    {
      enabled: isAuthenticated && isLoaded,
    }
  );

  if (!isLoaded || isLoading) {
    return <Skeleton className="h-5 w-10" />;
  }

  if (!isAuthenticated) {
    return (
      <span className="text-sm font-extrabold text-foreground">$0.00</span>
    );
  }

  return (
    <span className="text-sm font-extrabold text-foreground">
      {formatCurrency(Number(balance?.balance) || 0)}
    </span>
  );
};
