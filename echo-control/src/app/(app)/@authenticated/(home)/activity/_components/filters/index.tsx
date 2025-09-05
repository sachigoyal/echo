import { Skeleton } from '@/components/ui/skeleton';
import { RangeSelector } from './time-range-selector';

export const ActivityFilters = () => {
  return (
    <FiltersContainer>
      <RangeSelector />
    </FiltersContainer>
  );
};

export const LoadingActivityFilters = () => {
  return (
    <FiltersContainer>
      <Skeleton className="w-24 h-9" />
    </FiltersContainer>
  );
};

const FiltersContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center gap-2 justify-between">{children}</div>
  );
};
