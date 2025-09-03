import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/trpc/server';
import { Suspense } from 'react';

interface Props {
  appId: string;
}

const stats = ['Profit', 'Requests', 'Users', 'Tokens'];

export const StatsCards = async ({ appId }: Props) => {
  const overallStatsPromise = api.apps.app.stats.overall({ appId });

  return (
    <>
      <StatCard
        title={stats[0]}
        value={overallStatsPromise.then(({ totalProfit }) =>
          formatCurrency(totalProfit)
        )}
      />
      <StatCard
        title={stats[1]}
        value={overallStatsPromise.then(({ transactionCount }) =>
          transactionCount.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            notation: 'compact',
          })
        )}
      />
      <StatCard
        title={stats[2]}
        value={overallStatsPromise.then(({ numUsers }) =>
          numUsers.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            notation: 'compact',
          })
        )}
      />
      <StatCard
        title={stats[3]}
        value={overallStatsPromise.then(({ totalTokens }) =>
          totalTokens.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            notation: 'compact',
          })
        )}
      />
    </>
  );
};

export const LoadingStatsCards = () => {
  return stats.map(stat => <LoadingStatCard title={stat} key={stat} />);
};

interface StatsCardProps {
  title: string;
  value: Promise<string>;
}

const StatCard = ({ title, value }: StatsCardProps) => {
  return (
    <BaseStatCard title={title}>
      <Suspense fallback={<LoadingStatContent />}>
        <StatContent value={value} />
      </Suspense>
    </BaseStatCard>
  );
};

const StatContent = async ({ value }: { value: Promise<string> }) => {
  return <div className="text-2xl font-bold">{await value}</div>;
};

const LoadingStatCard = ({ title }: { title: string }) => {
  return (
    <BaseStatCard title={title}>
      <LoadingStatContent />
    </BaseStatCard>
  );
};

const LoadingStatContent = () => {
  return <div className="text-2xl font-bold">Loading...</div>;
};

const BaseStatCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <Card className="p-4">
      <h4>{title}</h4>
      {children}
    </Card>
  );
};
