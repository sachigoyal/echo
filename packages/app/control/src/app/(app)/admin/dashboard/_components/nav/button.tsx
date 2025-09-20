'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';

interface Props<T extends string> {
  children: React.ReactNode;
  href: Route<T>;
}

export const DashboardNavButton = <T extends string>({
  children,
  href,
}: Props<T>) => {
  const pathname = usePathname();

  return (
    <Button
      variant="ghost"
      className={cn(
        'lg:w-full lg:justify-start text-sm lg:text-base whitespace-nowrap px-3 lg:px-4 py-2 lg:py-2 min-h-[36px] lg:min-h-[40px]',
        pathname === href
          ? 'text-foreground font-medium bg-accent/50'
          : 'text-muted-foreground/80 font-normal hover:text-foreground hover:bg-accent/30'
      )}
    >
      {children}
    </Button>
  );
};
