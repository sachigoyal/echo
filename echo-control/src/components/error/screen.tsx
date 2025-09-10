import { ErrorCard } from './card';

import { cn } from '@/lib/utils';

import type { ErrorComponentProps } from './types';

interface Props extends ErrorComponentProps {
  className?: string;
}

export const ErrorScreen: React.FC<Props> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center',
        className
      )}
    >
      <ErrorCard {...props} />
    </div>
  );
};
