import { ErrorCard, NotFoundCard } from './card';

import { cn } from '@/lib/utils';

import type { ErrorComponentProps } from './types';

interface Props extends ErrorComponentProps {
  className?: string;
}

export const ErrorScreen: React.FC<Props> = ({ className, ...props }) => {
  return (
    <ErrorScreenContainer className={className}>
      <ErrorCard {...props} />
    </ErrorScreenContainer>
  );
};

export const NotFoundScreen: React.FC<Props> = ({ className, ...props }) => {
  return (
    <ErrorScreenContainer className={className}>
      <NotFoundCard {...props} />
    </ErrorScreenContainer>
  );
};

const ErrorScreenContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-center',
        className
      )}
    >
      {children}
    </div>
  );
};
