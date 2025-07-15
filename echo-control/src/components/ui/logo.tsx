import React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onClick?: () => void;
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, onClick, ...props }, ref) => {
    return (
      <div ref={ref} onClick={onClick} {...props}>
        <Image
          src="/logo/light.svg"
          alt="Merit Systems Logo"
          width={24}
          height={24}
          className={cn('size-6 dark:hidden', className)}
        />
        <Image
          src="/logo/dark.svg"
          alt="Merit Systems Logo"
          width={24}
          height={24}
          className={cn('size-6 hidden dark:block', className)}
        />
      </div>
    );
  }
);

Logo.displayName = 'Logo';
