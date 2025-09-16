import { cn } from '@/lib/utils';
import { LoadingStatsCards, StatsCards } from './stat-cards';
import { StatsOverlay } from './overlay';

interface Props {
  appId: string;
}

export const OverallAppStats: React.FC<Props> = ({ appId }) => {
  return (
    <OverallStatsContainer>
      <StatsCards appId={appId} />
      <StatsOverlay appId={appId} />
    </OverallStatsContainer>
  );
};

export const LoadingOverallAppStats = () => {
  return (
    <OverallStatsContainer>
      <LoadingStatsCards />
    </OverallStatsContainer>
  );
};

const OverallStatsContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={cn(
        'grid overflow-hidden h-full relative',
        'grid-cols-2 md:grid-cols-1',
        'rounded-b-lg md:rounded-bl-none md:rounded-r-lg',
        'border-t md:border-l md:border-t-0',
        '[&>*:nth-child(odd)]:border-r md:[&>*:nth-child(odd)]:border-r-0',
        '[&>*:nth-child(-n+2)]:border-b md:[&>*:not(:last-child)]:border-b'
      )}
    >
      {children}
    </div>
  );
};
