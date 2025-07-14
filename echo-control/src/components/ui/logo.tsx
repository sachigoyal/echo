import React from 'react';

import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLImageElement> {
  className?: string;
  onClick?: () => void;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  ({ className, onClick, ...props }, ref) => {
    return (
      <>
        <img
          ref={ref}
          src="/logo/light.svg"
          alt="Merit Systems Logo"
          className={cn('size-6 dark:hidden', className)}
          onClick={onClick}
          {...props}
        />
        <img
          src="/logo/dark.svg"
          alt="Merit Systems Logo"
          className={cn('size-6 hidden dark:block', className)}
          onClick={onClick}
          {...props}
        />
      </>
    );
  }
);

Logo.displayName = 'Logo';
