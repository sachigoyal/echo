import React from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  onClick?: () => void;
}

const logoProps = {
  alt: 'Merit Systems Logo',
  width: 100,
  height: 100,
  className: 'size-6',
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, onClick, ...props }, ref) => {
    return (
      <div ref={ref} onClick={onClick} {...props}>
        <Image
          src="/logo/light.svg"
          {...logoProps}
          className={cn('dark:hidden', logoProps.className, className)}
        />
        <Image
          src="/logo/dark.svg"
          {...logoProps}
          className={cn('hidden dark:block', logoProps.className, className)}
        />
      </div>
    );
  }
);

Logo.displayName = 'Logo';
