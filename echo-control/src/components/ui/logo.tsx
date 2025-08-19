import React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onClick?: () => void;
  priority?: boolean;
}
export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, onClick, priority, ...props }, ref) => {
    return (
      <div ref={ref} onClick={onClick} {...props}>
        <Image
          src="/logo/light.svg"
          alt="Merit Systems Logo"
          width={200}
          height={200}
          className={cn('dark:hidden size-6', className)}
          priority={priority}
        />
        <Image
          src="/logo/dark.svg"
          alt="Merit Systems Logo"
          width={200}
          height={200}
          className={cn('hidden dark:block size-6', className)}
          priority={priority}
        />
      </div>
    );
  }
);

Logo.displayName = 'Logo';
