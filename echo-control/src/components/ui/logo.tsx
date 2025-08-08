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
          width={200}
          height={200}
          className={cn('dark:hidden size-6', className)}
        />
        <Image
          src="/logo/dark.svg"
          alt="Merit Systems Logo"
          width={200}
          height={200}
          className={cn('hidden dark:block size-6', className)}
        />
      </div>
    );
  }
);

Logo.displayName = 'Logo';
